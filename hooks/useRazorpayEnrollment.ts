
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, User } from '@/types';
import { auth } from '@/services/firebase';
import { LOGO_URL } from '@/constants';
import { safeLocalStorage } from '@/utils/safeStorage';
import { PENDING_COURSE_STORAGE_KEY } from '@/constants';

interface UseRazorpayEnrollmentProps {
    user: User | null;
    onProfileUpdate?: (updates: Partial<User>) => void;
}

const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export const useRazorpayEnrollment = ({ user, onProfileUpdate }: UseRazorpayEnrollmentProps) => {
    const navigate = useNavigate();
    const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const completeEnrollment = useCallback(async (course: Course) => {
        if (!user) return;

        const updatedOngoingCourses = [...(user.ongoingCourses || []), course.id];
        const updatedEnrolledCourses = [...(user.enrolledCourses || []), course.id];

        if (onProfileUpdate) {
            onProfileUpdate({
                ongoingCourses: updatedOngoingCourses,
                enrolledCourses: updatedEnrolledCourses,
            });
        }

        setToastMessage(`Enrolled in ${course.title}`);
        setShowToast(true);
        navigate(`/courses/${course.id}/learn`);
    }, [user, onProfileUpdate, navigate]);

    const handleEnroll = useCallback(async (course: Course, couponCode?: string, discountedPrice?: number) => {
        if (!user) {
            safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
            navigate('/login');
            return;
        }

        const alreadyEnrolled = user.enrolledCourses.includes(course.id) || user.ongoingCourses.includes(course.id);

        if (alreadyEnrolled) {
            navigate(`/courses/${course.id}/learn`);
            return;
        }

        // Logic for Paid vs Free courses
        // If discountedPrice is provided (even if 0), use it. Otherwise fallback to course.price
        const priceValue = discountedPrice !== undefined ? discountedPrice : Number(course.price);
        const isPaidCourse = priceValue > 0;

        if (isPaidCourse) {
            setToastMessage('Processing Payment...');
            setShowToast(true);
            setEnrollingCourseId(course.id);
            try {
                // Dynamically load script
                const isLoaded = await loadRazorpayScript();
                if (!isLoaded) {
                    throw new Error("Failed to load Razorpay SDK. Please check your network connection.");
                }

                // 1. Create Order
                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) {
                    throw new Error('You must be signed in to enroll in a course.');
                }

                const res = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        courseId: course.id,
                        currency: 'INR',
                        couponCode: couponCode
                    }),
                });

                let order;

                if (!res.ok) {
                    // Fallback for Local Development (Mock Mode)
                    if (import.meta.env.DEV) {
                        console.warn('Backend API missing or failing. Using Mock Order Data for testing.');
                        setToastMessage('Dev Mode: Mocking Payment');
                        setShowToast(true);

                        order = {
                            id: `order_mock_${Date.now()}`,
                            amount: priceValue * 100,
                            currency: 'INR',
                            status: 'created'
                        };
                    } else {
                        const errText = await res.text();
                        let errMsg = res.statusText;
                        try {
                            const parsed = JSON.parse(errText);
                            errMsg = parsed.error || errMsg;
                        } catch(e) {}
                        throw new Error(`Failed to create order: ${errMsg}`);
                    }
                } else {
                    order = await res.json();
                }

                // 2. Open Razorpay Checkout
                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_YourFallbackKeyHere",
                    amount: order.amount,
                    currency: order.currency,
                    name: "Edusimulate",
                    description: `Enrollment for ${course.title}`,
                    image: LOGO_URL,
                    order_id: order.id,
                    handler: async function (response: any) {
                        try {
                            // 3. Verify Payment
                            let verifyData;
                            try {
                                const verifyRes = await fetch('/api/verify-payment', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Bearer ${idToken}`,
                                    },
                                    body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        userId: user.uid,
                                        courseId: course.id
                                    }),
                                });
                                verifyData = await verifyRes.json();
                            } catch (apiError) {
                                if (import.meta.env.DEV) {
                                    console.warn('Dev Mode: Mocking successful verification');
                                    verifyData = { success: true };
                                } else {
                                    throw apiError;
                                }
                            }

                            if (verifyData.success || (import.meta.env.DEV && !verifyData)) {
                                await completeEnrollment(course);
                            } else {
                                setToastMessage('Payment verification failed');
                                setShowToast(true);
                            }
                        } catch (err) {
                            if (import.meta.env.DEV) {
                                await completeEnrollment(course);
                                return;
                            }
                            console.error('Verification error', err);
                            setToastMessage('Payment verification error');
                            setShowToast(true);
                        } finally {
                            setEnrollingCourseId(null);
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: "",
                    },
                    theme: {
                        color: "#3399cc",
                    },
                    modal: {
                        ondismiss: function () {
                            setEnrollingCourseId(null);
                            setToastMessage('Payment Cancelled');
                            setShowToast(true);
                            document.body.style.overflow = 'auto';
                        }
                    }
                };

                const rzp1 = new (window as any).Razorpay(options);
                rzp1.on('payment.failed', function (response: any) {
                    setToastMessage('Payment Failed: ' + response.error.description);
                    setShowToast(true);
                    setEnrollingCourseId(null);
                    document.body.style.overflow = 'auto';
                });
                rzp1.open();

            } catch (error: any) {
                console.error('Payment initialization failed', error);
                setToastMessage(error?.message || 'Failed to initialize payment');
                setShowToast(true);
                setEnrollingCourseId(null);
            }
        } else {
            // Free course flow
            setEnrollingCourseId(course.id);
            try {
                const idToken = await auth.currentUser?.getIdToken();
                if (!idToken) {
                    throw new Error('You must be signed in to enroll in a course.');
                }

                const enrollRes = await fetch('/api/course/enroll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({ courseId: course.id }),
                });

                if (!enrollRes.ok) {
                    const errText = await enrollRes.text();
                    let errMsg = 'Failed to enroll in course';
                    try {
                        const parsed = JSON.parse(errText);
                        errMsg = parsed.error || errMsg;
                    } catch (error) {
                        void error;
                    }
                    throw new Error(errMsg);
                }

                await completeEnrollment(course);
            } catch (error: any) {
                console.error('Free enrollment failed', error);
                setToastMessage(error?.message || 'Enrollment failed');
                setShowToast(true);
            }
            setEnrollingCourseId(null);
        }
    }, [user, navigate, completeEnrollment]);

    return {
        handleEnroll,
        enrollingCourseId,
        toastMessage,
        showToast,
        setShowToast,
        setToastMessage
    };
};

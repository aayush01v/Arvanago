
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course, User } from '@/types';
import { updateUserProfile } from '@/services/firestoreService';
import { LOGO_URL } from '@/constants';
import { safeLocalStorage } from '@/utils/safeStorage';
import { PENDING_COURSE_STORAGE_KEY } from '@/constants';

interface UseRazorpayEnrollmentProps {
    user: User | null;
    onProfileUpdate?: (updates: Partial<User>) => void;
}

export const useRazorpayEnrollment = ({ user, onProfileUpdate }: UseRazorpayEnrollmentProps) => {
    const navigate = useNavigate();
    const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const completeEnrollment = useCallback(async (course: Course) => {
        if (!user) return;

        const updatedOngoingCourses = [...user.ongoingCourses, course.id];
        const updatedEnrolledCourses = [...user.enrolledCourses, course.id];

        try {
            await updateUserProfile(user.uid, {
                ongoingCourses: updatedOngoingCourses,
                enrolledCourses: updatedEnrolledCourses,
            });

            if (onProfileUpdate) {
                onProfileUpdate({
                    ongoingCourses: updatedOngoingCourses,
                    enrolledCourses: updatedEnrolledCourses,
                });
            }

            setToastMessage(`Enrolled in ${course.title}`);
            setShowToast(true);
            navigate(`/courses/${course.id}`);
        } catch (error) {
            console.error('Failed to enroll user', error);
            setToastMessage('Enrollment failed');
            setShowToast(true);
        }
    }, [user, onProfileUpdate, navigate]);

    const handleEnroll = useCallback(async (course: Course) => {
        if (!user) {
            safeLocalStorage.setItem(PENDING_COURSE_STORAGE_KEY, course.id);
            navigate('/login');
            return;
        }

        const alreadyEnrolled = user.enrolledCourses.includes(course.id) || user.ongoingCourses.includes(course.id);

        if (alreadyEnrolled) {
            navigate(`/courses/${course.id}`);
            return;
        }

        // Logic for Paid vs Free courses
        const priceValue = Number(course.price);
        const isPaidCourse = course.isPaid === true || (!isNaN(priceValue) && priceValue > 0);

        if (isPaidCourse) {
            setToastMessage('Processing Payment...');
            setShowToast(true);
            setEnrollingCourseId(course.id);
            try {
                // 1. Create Order
                const res = await fetch('/api/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        courseId: course.id,
                        currency: 'INR'
                    }),
                });

                let order;

                if (!res.ok) {
                    // Fallback for Local Development (Mock Mode)
                    if (import.meta.env.DEV || res.status === 404 || res.status === 500) {
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
                        throw new Error(`Failed to create order: ${res.statusText}`);
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
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
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

            } catch (error) {
                console.error('Payment initialization failed', error);
                setToastMessage('Failed to initialize payment');
                setShowToast(true);
                setEnrollingCourseId(null);
            }
        } else {
            // Free course flow
            setEnrollingCourseId(course.id);
            await completeEnrollment(course);
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

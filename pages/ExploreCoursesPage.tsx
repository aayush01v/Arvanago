import React, { useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import CourseList from '@/components/CourseList.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';
import { useRazorpayEnrollment } from '@/hooks/useRazorpayEnrollment';
import Icon from '@/components/common/Icon';

const Toast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
      <div className="glass-reflection flex items-center gap-3 px-6 py-3 rounded-full bg-white/90 dark:bg-slate-800/90 border border-white/40 dark:border-slate-700 shadow-2xl backdrop-blur-md text-slate-800 dark:text-white">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md">
          <Icon name="check" className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-semibold tracking-wide">{message}</span>
      </div>
    </div>
  );
};

const ExploreCoursesPage: React.FC = () => {
  const { user, courses, coursesLoading, coursesError, refreshCourses, onProfileUpdate } = useOutletContext<SidebarLayoutContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCategory = searchParams.get('category') ?? 'All';

  const { handleEnroll, isLoading: isEnrollmentLoading, toastMessage, showToast, setShowToast } = useRazorpayEnrollment({
    user,
    onProfileUpdate
  });

  const handlePreviewCourse = useCallback(
    (course: Course) => {
      navigate(`/courses/${course.id}`);
    },
    [navigate],
  );

  const handleWishlistToggle = useCallback(
    (course: Course) => {
      if (!user) return;

      const isWishlisted = user.wishlist.includes(course.id);
      const updatedWishlist = isWishlisted
        ? user.wishlist.filter((id) => id !== course.id)
        : [...user.wishlist, course.id];

      onProfileUpdate({ wishlist: updatedWishlist });
      void updateUserProfile(user.uid, { wishlist: updatedWishlist });
    },
    [onProfileUpdate, user],
  );

  useEffect(() => {
    void refreshCourses();
  }, [refreshCourses]);

  return (
    <>
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <CourseList
        courses={courses}
        navigateToCourse={handleEnroll} // Use handleEnroll instead of direct navigation
        onPreviewCourse={handlePreviewCourse}
        onToggleWishlist={handleWishlistToggle}
        wishlistCourseIds={user?.wishlist}
        enrolledCourseIds={user?.enrolledCourses}
        ongoingCourseIds={user?.ongoingCourses}
        initialCategory={initialCategory}
        isLoading={coursesLoading}
        errorMessage={coursesError}
      />
    </>
  );
};

export default ExploreCoursesPage;

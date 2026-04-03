import React, { useCallback, useEffect } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import CourseList from '@/components/CourseList.tsx';
import { Course } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';
import { useRazorpayEnrollment } from '@/hooks/useRazorpayEnrollment';
import Icon from '@/components/common/Icon';
import SEO from '@/components/SEO';
import Card from '@/components/common/Card';
import Chip from '@/components/common/Chip';

const Toast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
      <Card variant="glass" className="glass-reflection flex items-center gap-3 rounded-full px-4 py-2 backdrop-blur-md text-slate-800 dark:text-white">
        <Chip variant="success" active className="w-8 justify-center p-0">
          <Icon name="check" className="w-3.5 h-3.5" />
        </Chip>
        <span className="text-sm font-semibold tracking-wide">{message}</span>
      </Card>
    </div>
  );
};

const ExploreCoursesPage: React.FC = () => {
  const { user, courses, coursesLoading, coursesError, refreshCourses, onProfileUpdate } = useOutletContext<SidebarLayoutContext>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialCategory = searchParams.get('category') ?? 'All';

  const { handleEnroll, enrollingCourseId, toastMessage, showToast, setShowToast } = useRazorpayEnrollment({
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



  return (
    <>
      <SEO
        title="Explore Courses"
        description="Browse our comprehensive catalog of interactive courses designed to help you master new skills."
        url={typeof window !== 'undefined' ? `${window.location.origin}/explore` : 'https://edusimulate.vercel.app/explore'}
        type="website"
      />
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
      <CourseList
        courses={courses}
        navigateToCourse={handleEnroll} // Use handleEnroll instead of direct navigation
        enrollingCourseId={enrollingCourseId}
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

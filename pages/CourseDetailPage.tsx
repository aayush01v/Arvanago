import React, { useEffect, useMemo } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import CourseDetail from '@/components/CourseDetail.tsx';
import { Lecture } from '@/types';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import SEO from '@/components/SEO';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, coursesLoading, user } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);

  useEffect(() => {
    // Redundant check removed as App.tsx/CourseRouteWrapper handles the primary redirect.
    // Keeping this as a safety fallback is fine, or we can remove it to simply logic.
    // For now, we will simplify.
  }, [courseId, navigate, user]);

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-primary" />
      </div>
    );
  }

  if (!course) {
    return <Navigate to="/explore" replace />;
  }

  return (
    <>
      <SEO
        title={course.title}
        description={course.description}
        image={course.previewImageUrl ?? course.thumbnailUrl ?? course.thumbnail}
        url={typeof window !== 'undefined' ? window.location.href : `https://edusimulate.vercel.app/courses/${course.id}`}
        type="article"
        structuredData={{
          '@type': 'Course',
          name: course.title,
          description: course.description,
          provider: {
            '@type': 'Organization',
            name: 'Edusimulate',
            sameAs: 'https://edusimulate.vercel.app/'
          },
          offers: {
            '@type': 'Offer',
            price: course.price ?? 0,
            priceCurrency: course.currency ?? 'INR',
            availability: 'https://schema.org/InStock',
          }
        }}
      />
      <CourseDetail
        course={course}
        navigateToLecture={(selectedCourse, lecture: Lecture) =>
          navigate(`/courses/${selectedCourse.id}/lectures/${lecture.id}`)
        }
        onStartLearning={(selectedCourse) => navigate(`/courses/${selectedCourse.id}/learn`)}
        onNavigateToCourse={(targetCourseId) => navigate(`/courses/${targetCourseId}`)}
      />
    </>
  );
};

export default CourseDetailPage;

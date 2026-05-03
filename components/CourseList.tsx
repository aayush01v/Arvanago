import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Course } from '../types.ts';
import Icon from './common/Icon.tsx';
import SkeletonCard from './common/SkeletonCard.tsx';
import { motion, AnimatePresence } from 'framer-motion';

interface CourseListProps {
  courses: Course[];
  navigateToCourse: (course: Course) => void;
  onPreviewCourse?: (course: Course) => void;
  onToggleWishlist?: (course: Course) => void;
  wishlistCourseIds?: string[];
  enrolledCourseIds?: string[];
  ongoingCourseIds?: string[];
  initialCategory?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  enrollingCourseId?: string | null;
}

interface CourseCardProps {
  course: Course;
  onEnrollCourse: (course: Course) => void;
  onPreviewCourse: (course: Course) => void;
  onToggleWishlist?: (course: Course) => void;
  isWishlisted?: boolean;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
  index: number;
}

const CourseCardComponent: React.FC<CourseCardProps> = ({
  course,
  onEnrollCourse,
  onPreviewCourse,
  onToggleWishlist,
  isWishlisted = false,
  isEnrolled = false,
  isEnrolling = false,
  index
}) => {
  const coverImage = course.thumbnailUrl ?? course.thumbnail;
  const isPaid = course.isPaid || (typeof course.price === 'number' && course.price > 0);
  const wishlisted = isWishlisted;

  const handleWishlistClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleWishlist?.(course);
  };
  const priceLabel = (() => {
    if (!isPaid) {
      return 'Free';
    }

    if (course.price == null) {
      return 'Premium';
    }

    const currency = 'INR';

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
        maximumFractionDigits: 0,
      }).format(course.price);
    } catch (error) {
      console.warn('Unable to format course price', error);
      return `₹${course.price}`;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      className="interactive-card flex flex-col rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg overflow-hidden cursor-pointer group hover:shadow-2xl hover:border-brand-primary/30 transition-all duration-300"
    >
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-70 group-hover:opacity-50 transition-opacity" />
        <img
          src={coverImage}
          alt={course.title}
          className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
          loading="lazy"
        />

        <div className="absolute top-4 left-4 z-20">
          <span className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white shadow-lg">
            {isEnrolled ? 'Enrolled' : priceLabel}
          </span>
        </div>

        {!isEnrolled && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleWishlistClick}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors group/btn"
          >
            <Icon
              name={wishlisted ? 'heart-filled' : 'heart'}
              className={`w-5 h-5 transition-colors ${wishlisted ? 'text-red-500' : 'text-white group-hover/btn:text-red-400'}`}
            />
          </motion.button>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center text-[10px] text-white overflow-hidden shadow-lg`}>
                <img src={`https://i.pravatar.cc/100?img=${(course.id.charCodeAt(0) + i) % 70}`} loading="lazy" decoding="async" alt="User" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
            <Icon name="star" className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-bold text-white">{course.rating || '4.8'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow relative">
        <div className="mb-4">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors group-hover:text-brand-primary line-clamp-2">
            {course.title}
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        </div>

        {course.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {course.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5"><Icon name="clock" className="w-3.5 h-3.5" /> {course.totalDuration || 'Self-paced'}</span>
            <span className="flex items-center gap-1.5"><Icon name="users" className="w-3.5 h-3.5" /> {(course.studentCount || 100).toLocaleString()} learners</span>
          </div>

          {isEnrolled ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onEnrollCourse(course)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary text-white font-bold shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Icon name="play" className="w-4 h-4" /> Continue Learning
            </motion.button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onPreviewCourse(course)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                Preview
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onEnrollCourse(course)}
                disabled={isEnrolling}
                className={`py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                  ${isEnrolling
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-80'
                    : 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white'
                  }`}
              >
                {isEnrolling ? (
                  <>
                    <Icon name="spinner" className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>{isPaid ? 'Enroll' : 'Start Free'}</>
                )}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CourseCard = memo(CourseCardComponent);

const CourseList: React.FC<CourseListProps> = ({
  courses,
  navigateToCourse,
  onPreviewCourse,
  onToggleWishlist,
  wishlistCourseIds,
  enrolledCourseIds,
  ongoingCourseIds,
  initialCategory = 'All',
  isLoading = false,
  errorMessage,
  enrollingCourseId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Use local state for more granular filtering if needed later
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const publishedCourses = useMemo(() => courses.filter((course) => course.isPublished), [courses]);

  const deferredCategory = useDeferredValue(selectedCategory);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(publishedCourses.map((course) => course.category));
    return ['All', ...Array.from(uniqueCategories)];
  }, [publishedCourses]);

  const filteredCourses = useMemo(() => {
    let result = publishedCourses;

    if (deferredCategory !== 'All') {
      result = result.filter((course) => course.category === deferredCategory);
    }

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(c => c.title.toLowerCase().includes(lowerTerm) || c.description.toLowerCase().includes(lowerTerm));
    }

    return result;
  }, [deferredCategory, publishedCourses, searchTerm]);

  const handleSelectCategory = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleEnrollCourse = useCallback((course: Course) => {
    navigateToCourse(course);
  }, [navigateToCourse]);

  const handlePreview = useCallback((course: Course) => {
    if (onPreviewCourse) {
      onPreviewCourse(course);
      return;
    }

    navigateToCourse(course);
  }, [navigateToCourse, onPreviewCourse]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[32px] glass-ambient dark:bg-slate-900/60 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10 max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight"
          >
            Explore Courses
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8"
          >
            Discover immersive lessons curated for modern creators. From coding to design, find your next breakthrough.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            <div className="relative flex-grow max-w-md">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search for courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleSelectCategory(category)}
                className={`
                        px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 border
                        ${selectedCategory === category
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg transform scale-105'
                    : 'bg-white/40 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-white hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white'
                  }
                    `}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-h-[500px]">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={index} />)
        ) : errorMessage ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-rose-200/60 bg-white/40 p-16 text-center shadow-lg dark:border-rose-500/30 dark:bg-rose-900/10 backdrop-blur-md">
            <Icon name="alert-triangle" className="mb-4 h-12 w-12 text-rose-500" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{errorMessage}</p>
          </div>
        ) : filteredCourses.length > 0 ? (
          <AnimatePresence>
            {filteredCourses.map((course, idx) => (
              <CourseCard
                key={course.id}
                course={course}
                index={idx}
                onEnrollCourse={handleEnrollCourse}
                onPreviewCourse={handlePreview}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlistCourseIds?.includes(course.id)}
                isEnrolled={
                  enrolledCourseIds?.includes(course.id) || ongoingCourseIds?.includes(course.id)
                }
                isEnrolling={enrollingCourseId === course.id}
              />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/20 dark:bg-slate-800/20 p-20 text-center backdrop-blur-sm"
          >
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Icon name="search" className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No courses found</h3>
            <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
              We couldn&apos;t find any courses for "{selectedCategory}"{searchTerm && ` matching "${searchTerm}"`}.
              <br />Try adjusting your filters or search term.
            </p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchTerm(''); }}
              className="mt-6 px-6 py-2 rounded-xl bg-brand-primary text-white font-bold hover:bg-brand-secondary transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CourseList;

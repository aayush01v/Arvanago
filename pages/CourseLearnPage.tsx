import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  ArrowLeft, Award, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Cpu, Download, File, Inbox, Layout, Layers, MessageCircle, Play,
  PlusSquare, Star, X
} from 'lucide-react';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';
import { CourseSection, Lecture } from '@/types.ts';
import GlassPreviewPlayer from '@/components/media/GlassPreviewPlayer.tsx';

// --- Glass UI Components ---

const GlassPanel: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/5 shadow-2xl rounded-3xl ${className}`}>
    {children}
  </div>
);

const GlassButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({ className = '', active, ...props }) => (
  <button
    className={`
      transition-all duration-300 ease-out active:scale-95
      backdrop-blur-md border 
      ${active
        ? 'bg-brand-primary/20 border-brand-primary/50 text-brand-primary shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)]'
        : 'bg-white/5 border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/10 hover:border-white/20 hover:shadow-lg'
      }
      ${className}
    `}
    {...props}
  />
);

// --- Sub Components ---

const SectionSummary: React.FC<{ section: CourseSection; currentLectureId: string; onSelect: (lecture: Lecture) => void }> = React.memo(({
  section,
  currentLectureId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const completedLectures = section.lectures.filter((lecture) => lecture.isCompleted).length;
  const progress = section.lectures.length ? Math.round((completedLectures / section.lectures.length) * 100) : 0;

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.07]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-white/5 outline-none focus-visible:bg-white/5"
      >
        <div className="flex items-center gap-4">
          <div className={`
            flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500
            ${progress === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-primary/20 text-brand-primary'}
          `}>
            {progress === 100 ? <CheckCircle className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white/90">{section.title}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
              <span>{section.lectures.length} lessons</span>
              <span className="h-1 w-1 rounded-full bg-slate-400 dark:bg-white/20" />
              <span>{progress}% complete</span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 dark:text-white/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <ul className="overflow-hidden">
          {section.lectures.map((lecture, idx) => (
            <li key={lecture.id} className={idx === section.lectures.length - 1 ? 'pb-2' : ''}>
              <button
                onClick={() => onSelect(lecture)}
                className={`
                   group flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-200 border-l-2
                   ${currentLectureId === lecture.id
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-transparent hover:bg-white/5 hover:border-white/20'
                  }
                `}
              >
                <div className={`
                  flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300
                  ${lecture.isCompleted
                    ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-500'
                    : currentLectureId === lecture.id
                      ? 'border-brand-primary/50 text-brand-primary'
                      : 'border-slate-300 dark:border-white/20 text-transparent group-hover:border-white/40'
                  }
                `}>
                  {lecture.isCompleted ? <Check className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-colors ${currentLectureId === lecture.id ? 'text-brand-primary' : 'text-slate-700 dark:text-white/80 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                    {lecture.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-white/40 flex gap-2 items-center">
                    <Clock className="w-3 h-3" /> {lecture.duration}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
});

// --- Main Page Component ---

const CourseLearnPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses, user, coursesLoading, onProfileUpdate } = useOutletContext<SidebarLayoutContext>();
  const navigate = useNavigate();

  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false); // Mobile drawer state

  const course = useMemo(() => courses.find((c) => c.id === courseId), [courses, courseId]);
  const lectures = useMemo(() => {
    if (!course) return [];
    if (course.sections && course.sections.length > 0) {
      return course.sections.flatMap((section) => section.lectures);
    }
    return course.lectures ?? [];
  }, [course]);
  const isEnrolled = useMemo(
    () => Boolean(course && (user.enrolledCourses.includes(course.id) || user.ongoingCourses.includes(course.id))),
    [course, user.enrolledCourses, user.ongoingCourses],
  );
  const primaryLecture = useMemo(
    () => lectures.find((lecture) => lecture.isPreview) ?? lectures[0],
    [lectures],
  );

  const [currentLectureId, setCurrentLectureId] = useState<string | null>(primaryLecture?.id ?? null);
  const [activeSection, setActiveSection] = useState<string>('Overview');
  const [isCompleting, setIsCompleting] = useState(false);
  const [taskInput, setTaskInput] = useState('');

  const [tasks, setTasks] = useState([
    { id: 'task-1', title: 'Review lecture notes', status: 'In progress' },
    { id: 'task-2', title: 'Try the coding exercise', status: 'Pending' },
  ]);

  const sectionList = useMemo(
    () => course?.sections ?? [{ title: 'All lectures', lectures }],
    [course?.sections, lectures],
  );

  // Flattened list for navigation
  const allLectures = useMemo(() => sectionList.flatMap(s => s.lectures), [sectionList]);

  const goToNextLecture = useCallback(() => {
    if (!currentLectureId) return;
    const currentIndex = allLectures.findIndex(l => l.id === currentLectureId);
    if (currentIndex !== -1 && currentIndex < allLectures.length - 1) {
      setCurrentLectureId(allLectures[currentIndex + 1].id);
    }
  }, [currentLectureId, allLectures]);

  const goToPrevLecture = useCallback(() => {
    if (!currentLectureId) return;
    const currentIndex = allLectures.findIndex(l => l.id === currentLectureId);
    if (currentIndex > 0) {
      setCurrentLectureId(allLectures[currentIndex - 1].id);
    }
  }, [currentLectureId, allLectures]);

  const markAsCompleted = useCallback(async () => {
    if (!user || !course || !currentLectureId || isCompleting) return;

    // Optimistic UI update could happen here, or wait for DB
    setIsCompleting(true);
    try {
      const currentProgress = user.progress?.[course.id] || [];
      if (!currentProgress.includes(currentLectureId)) {
        const newProgress = [...currentProgress, currentLectureId];

        // 1. Update local Context state immediately for responsiveness
        onProfileUpdate({
          progress: {
            ...user.progress,
            [course.id]: newProgress
          }
        });

        // 2. Persist to Firestore
        await updateUserProfile(user.uid, {
          progress: {
            ...user.progress,
            [course.id]: newProgress
          }
        });
      }
    } catch (error) {
      console.error("Failed to mark lecture complete:", error);
    } finally {
      setIsCompleting(false);
    }
  }, [user, course, currentLectureId, isCompleting, onProfileUpdate]);

  const totalLessons = useMemo(
    () => sectionList.reduce((total, section) => total + section.lectures.length, 0),
    [sectionList],
  );

  const resourcesCount = useMemo(() => course?.resources?.length ?? 0, [course?.resources]);

  const currentLecture = useMemo(
    () => lectures.find((lecture) => lecture.id === currentLectureId) ?? primaryLecture ?? null,
    [currentLectureId, lectures, primaryLecture],
  );

  const isLectureDataReady = useMemo(
    () => lectures.length > 0 && Boolean(primaryLecture) && Boolean(currentLecture),
    [currentLecture, lectures, primaryLecture],
  );

  const placeholderLecture: Lecture = useMemo(
    () => ({
      id: 'pending-sync',
      title: 'Content is syncing...',
      duration: 'Updating...',
      videoUrl: '',
      isCompleted: false,
      summary: 'Your lecture list is being updated.',
      isPreview: true,
    }),
    [],
  );




  const displayedLecture = isLectureDataReady ? (currentLecture as Lecture) : placeholderLecture;
  const isSyncingLectures = !isLectureDataReady;

  const handleSelectLecture = useCallback(
    (lecture: Lecture) => {
      if (!isLectureDataReady) return;
      setCurrentLectureId((prev) => (prev === lecture.id ? prev : lecture.id));
      setIsPlaylistOpen(false); // Close drawer on mobile
    },
    [isLectureDataReady],
  );

  useEffect(() => {
    if (!user || !course || coursesLoading || !isEnrolled) return;
    const alreadyEnrolled = user.enrolledCourses.includes(course.id);
    const alreadyOngoing = user.ongoingCourses.includes(course.id);

    if (alreadyEnrolled && alreadyOngoing) return;

    const updatedEnrolledCourses = alreadyEnrolled ? user.enrolledCourses : [...user.enrolledCourses, course.id];
    const updatedOngoingCourses = alreadyOngoing ? user.ongoingCourses : [...user.ongoingCourses, course.id];

    onProfileUpdate({
      enrolledCourses: updatedEnrolledCourses,
      ongoingCourses: updatedOngoingCourses,
    });

    void updateUserProfile(user.uid, {
      enrolledCourses: updatedEnrolledCourses,
      ongoingCourses: updatedOngoingCourses,
    });
  }, [course, coursesLoading, isEnrolled, onProfileUpdate, user]);

  const navigationSections = useMemo(
    () => [
      { label: 'Overview', icon: Layout },
      { label: 'Resources', icon: Download },
      { label: 'Simulations', icon: Cpu },
      { label: 'Add task', icon: PlusSquare },
      { label: 'My doubts', icon: MessageCircle },
    ],
    [],
  );

  const handleAddTask = useCallback(() => {
    if (!taskInput.trim()) return;
    setTasks((prev) => [
      { id: `task-${prev.length + 1}`, title: taskInput.trim(), status: 'Pending' },
      ...prev,
    ]);
    setTaskInput('');
  }, [taskInput]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentLectureId]);

  if (coursesLoading || !course) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-primary" />
      </div>
    );
  }

  if (!isEnrolled) {
    return <Navigate to={course ? `/courses/${course.id}` : '/dashboard'} replace />;
  }

  return (
    <div className="relative min-h-screen glass-ambient text-slate-900 dark:text-white overflow-x-hidden selection:bg-brand-primary/30">
      {/* Background Ambience is handled by class 'glass-ambient' */}


      <main className="relative z-10 mx-auto max-w-[1920px] p-4 sm:p-6 lg:p-8 flex flex-col gap-6">

        {/* Top Navbar */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <GlassButton
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium text-sm">Dashboard</span>
          </GlassButton>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/40 font-semibold">Course Progress</span>
              <span className="text-lg font-bold tabular-nums text-slate-800 dark:text-white">{course.progress}%</span>
            </div>

            <div className="relative h-12 w-12 group">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-200 dark:text-white/10 fill-none stroke-current" strokeWidth="3" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-brand-primary fill-none stroke-current drop-shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.5)] transition-all duration-1000 ease-out" strokeDasharray={`${course.progress}, 100`} strokeWidth="3" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Award className="h-5 w-5 text-brand-primary group-hover:scale-110 transition-transform" />
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            {/* Mobile Menu Toggle */}
            <button
              className="xl:hidden flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/25 hover:bg-brand-secondary active:scale-95 transition-all"
              onClick={() => setIsPlaylistOpen(true)}
              aria-label="Open Course Curriculum"
            >
              <div className="flex items-center justify-center p-0.5 rounded-full bg-white/20">
                <Play className="h-3 w-3 fill-current" />
              </div>
              <span className="font-bold text-sm tracking-wide">Lessons</span>
            </button>
          </div>
        </header>

        {/* Main Content Info */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* Left Column: Video & Tabs */}
          <div className="w-full flex-1 min-w-0 space-y-6">

            {/* Video Player Container - Glass Glow Effect */}

            {/* Video Player Container */}
            <div className="relative group rounded-3xl p-1 neon-border bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-brand-primary/10 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

              <div className="relative w-full overflow-hidden rounded-[20px] bg-black shadow-inner z-10">
                <GlassPreviewPlayer
                  videoUrl={displayedLecture.videoUrl}
                  title={displayedLecture.title}
                  poster={course.thumbnail}
                />
              </div>
            </div>

            {/* Lecture Header */}
            <div className="px-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/70">
                    {displayedLecture.title}
                  </h1>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-500 dark:text-white/50">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <Clock className="h-3.5 w-3.5" />
                      {displayedLecture.duration}
                    </span>
                    <span className="hidden sm:inline-block">•</span>
                    <span className="hidden sm:inline-block">Lesson {sectionList.flatMap(s => s.lectures).findIndex(l => l.id === displayedLecture.id) + 1} of {totalLessons}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <GlassButton
                    onClick={markAsCompleted}
                    className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 ${(user.progress?.[course.id] || []).includes(displayedLecture.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'text-brand-primary'
                      }`}
                    disabled={isCompleting}
                  >
                    {(user.progress?.[course.id] || []).includes(displayedLecture.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 opacity-50" />
                        <span>Mark Complete</span>
                      </>
                    )}
                  </GlassButton>

                  <GlassButton
                    className="p-3 rounded-full"
                    title="Previous Lecture"
                    aria-label="Previous Lecture"
                    onClick={goToPrevLecture}
                    disabled={allLectures.findIndex(l => l.id === displayedLecture.id) <= 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </GlassButton>
                  <GlassButton
                    className="p-3 rounded-full"
                    title="Next Lecture"
                    aria-label="Next Lecture"
                    onClick={goToNextLecture}
                    disabled={allLectures.findIndex(l => l.id === displayedLecture.id) >= allLectures.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </GlassButton>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Playlist Sidebar (Desktop Sticky / Mobile Drawer) */}
          <>
            {/* Backdrop for Mobile */}
            {isPlaylistOpen && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden transition-opacity"
                onClick={() => setIsPlaylistOpen(false)}
              />
            )}

            <aside className={`
                fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-50/90 dark:bg-[#0f172a]/95 backdrop-blur-xl shadow-2xl 
                transition-all duration-300 ease-out 
                xl:transform-none xl:static xl:w-[300px] xl:bg-transparent xl:shadow-none xl:backdrop-blur-none xl:z-auto xl:translate-x-0 xl:opacity-100 xl:visible
                ${isPlaylistOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-full opacity-0 invisible'}
             `}>
              <div className="h-full flex flex-col xl:h-auto xl:sticky xl:top-0">

                {/* Mobile Header */}
                <div className="flex items-center justify-between p-5 xl:hidden border-b border-white/5">
                  <h2 className="text-lg font-bold">Course Content</h2>
                  <button onClick={() => setIsPlaylistOpen(false)} className="p-2 rounded-full hover:bg-white/10" aria-label="Close Menu">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Playlist Content */}
                <GlassPanel className="flex-1 xl:max-h-[calc(100vh-120px)] overflow-hidden flex flex-col !rounded-none xl:!rounded-3xl !border-x-0 xl:!border">
                  <div className="p-5 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Curriculum</h3>
                    <p className="text-sm text-slate-500 dark:text-white/50">{totalLessons} Lectures • 12h 45m Total</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {sectionList.map((section, idx) => (
                      <SectionSummary
                        key={idx}
                        section={section}
                        currentLectureId={currentLectureId ?? ''}
                        onSelect={handleSelectLecture}
                      />
                    ))}
                  </div>
                </GlassPanel>
              </div>
            </aside>
          </>

        </div>
        {/* Bottom Content: Full Width */}
        <GlassPanel className="min-h-[400px] mt-8">
          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b border-white/10 p-2 scrollbar-none snap-x">
            {navigationSections.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveSection(item.label)}
                className={`
                      flex-1 relative px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                      ${activeSection === item.label
                    ? 'text-brand-primary bg-brand-primary/10 shadow-[inner_0_0_10px_rgba(var(--brand-primary-rgb),0.1)]'
                    : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-white/5'
                  }
                    `}
              >
                <div className="flex items-center justify-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 animate-fade-in">
            {activeSection === 'Overview' && (
              <div className="space-y-8 w-full">
                <div>
                  <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">About this Topic</h3>
                  <p className="text-lg leading-relaxed text-slate-600 dark:text-white/70 font-light">
                    {course.longDescription || course.description}
                  </p>
                </div>

                {course.learningOutcomes && (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-400" />
                      Key Takeaways
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-4">
                      {course.learningOutcomes.map((item, i) => (
                        <li key={i} className="flex gap-3 text-slate-600 dark:text-white/70 text-sm">
                          <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'Resources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Downloadable Materials</h3>
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-slate-500 dark:text-white/50">{resourcesCount} Files</span>
                </div>

                {course.resources && course.resources.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {course.resources.map(res => (
                      <div key={res.id} className="interactive-card p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-brand-primary/30 hover:bg-white/10 cursor-pointer">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-500 group-hover:scale-110 transition-transform">
                            <File className="h-6 w-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-slate-800 dark:text-white group-hover:text-brand-primary transition-colors">{res.name}</p>
                            <p className="text-xs text-slate-500 dark:text-white/40 mt-1">PDF Document</p>
                          </div>
                          <Download className="h-5 w-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <Inbox className="h-12 w-12 opacity-50 mb-3" />
                    <p>No resources available just yet.</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'Add task' && (
              <div className="w-full">
                <div className="relative mb-8 group">
                  <input
                    type="text"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="What's your next goal?"
                    className="w-full pl-6 pr-32 py-4 rounded-2xl bg-white/5 border border-white/10 focus:border-brand-primary/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-white/30"
                  />
                  <button
                    onClick={handleAddTask}
                    className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-brand-primary text-white font-medium hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/25"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                      <button className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400 dark:border-white/30 group-hover:border-brand-primary'}`} aria-label="Toggle task status">
                        {task.status === 'Completed' && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                      <span className={`text-lg transition-all ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-white/30' : 'text-slate-800 dark:text-white'}`}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {tasks.length === 0 && <p className="text-center text-slate-500 dark:text-white/40 italic">Start by adding a task above.</p>}
                </div>
              </div>
            )}

            {activeSection === 'My doubts' && (
              <div className="w-full space-y-4">
                <textarea
                  className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all resize-none min-h-[160px] text-lg placeholder:text-slate-400 dark:placeholder:text-white/30"
                  placeholder="Ask a question about this lecture..."
                />
                <div className="flex justify-end">
                  <GlassButton className="px-8 py-3 rounded-xl bg-brand-primary/80 hover:bg-brand-primary text-white font-semibold shadow-lg shadow-brand-primary/20">
                    Post Question
                  </GlassButton>
                </div>
              </div>
            )}

            {activeSection === 'Simulations' && (
              <div className="space-y-6">
                {course.simulations && course.simulations.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {course.simulations.map((sim) => (
                      <div key={sim.id} className="interactive-card group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/80 to-purple-900/80 p-8 text-white shadow-2xl">
                        <div className="relative z-10">
                          <h4 className="text-2xl font-bold mb-2">{sim.title}</h4>
                          <p className="text-indigo-100 mb-6">{sim.description}</p>
                          <a
                            href={sim.launchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-6 py-2.5 bg-white/20 backdrop-blur-md rounded-xl font-semibold hover:bg-white/30 transition-all border border-white/10 text-white"
                          >
                            Launch Simulation
                          </a>
                        </div>
                        <img
                          src={sim.thumbnail}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <Cpu className="absolute -bottom-4 -right-4 h-40 w-40 text-white/5 rotate-12 group-hover:rotate-6 transition-all duration-500" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <Cpu className="h-16 w-16 opacity-30 mb-4" />
                    <h4 className="text-lg font-medium text-slate-600 dark:text-slate-300">No simulations active</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Interactive labs for this course are coming soon.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlassPanel>
      </main>
    </div>
  );
};

export default CourseLearnPage;

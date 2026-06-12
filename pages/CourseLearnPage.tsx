import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Navigate, useNavigate, useOutletContext, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Award, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
  Clock, Cpu, Download, File, Inbox, Layout, Layers, MessageCircle, Play,
  PlusSquare, Star, X, Menu
} from 'lucide-react';
import { SidebarLayoutContext } from '@/components/SidebarLayout.tsx';
import { updateUserProfile } from '@/services/firestoreService.ts';
import { CourseSection, Lecture } from '@/types.ts';
import GlassPreviewPlayer from '@/components/media/GlassPreviewPlayer.tsx';
import confetti from 'canvas-confetti';

// --- UI Components ---
const SolidPanel: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const SolidButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({ className = '', active, ...props }) => (
  <button
    className={`
      transition-all duration-200 ease-out active:scale-95 border flex items-center justify-center font-semibold
      ${active
        ? 'bg-brand-primary border-brand-primary text-white shadow-sm hover:opacity-90'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
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
    <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/20 transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/80 outline-none"
      >
        <div className="flex items-center gap-3">
          <div className={`
            flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 shadow-sm
            ${progress === 100 ? 'bg-emerald-100 border border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-white border border-slate-200 text-brand-primary dark:bg-slate-800 dark:border-slate-600 dark:text-brand-light'}
          `}>
            {progress === 100 ? <CheckCircle className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{section.title}</p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <span>{section.lectures.length} lessons</span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{progress}% complete</span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <ul className="overflow-hidden bg-white dark:bg-slate-900/60">
          {section.lectures.map((lecture, idx) => (
            <li key={lecture.id} className="border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onSelect(lecture)}
                className={`
                   group flex w-full items-start sm:items-center gap-3 px-4 py-3 text-left transition-all duration-200 border-l-2
                   ${currentLectureId === lecture.id
                    ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
                    : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }
                `}
              >
                <div className={`
                  flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 mt-0.5 sm:mt-0
                  ${lecture.isCompleted
                    ? 'border-emerald-500/50 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : currentLectureId === lecture.id
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-slate-300 dark:border-slate-600 text-transparent group-hover:border-slate-400 dark:group-hover:text-slate-400'
                  }
                `}>
                  {lecture.isCompleted ? <Check className="h-3 w-3" /> : <Play className="h-2.5 w-2.5 ml-[1px]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors ${currentLectureId === lecture.id ? 'text-brand-primary dark:text-brand-light' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                    {lecture.title}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex gap-1.5 items-center mt-0.5">
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
  const location = useLocation();

  const handleBack = useCallback(() => {
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  }, [navigate, location]);

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
    setIsCompleting(true);
    try {
      const currentProgress = user.progress?.[course.id] || [];
      if (!currentProgress.includes(currentLectureId)) {
        const newProgress = [...currentProgress, currentLectureId];
        const newPoints = (user.points || 0) + 15;
        
        onProfileUpdate({
          points: newPoints,
          progress: {
            ...user.progress,
            [course.id]: newProgress
          }
        });
        await updateUserProfile(user.uid, {
          points: newPoints,
          progress: {
            ...user.progress,
            [course.id]: newProgress
          }
        });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#818cf8', '#34d399', '#ffbbf2']
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-primary" />
      </div>
    );
  }

  if (!isEnrolled) {
    return <Navigate to={course ? `/courses/${course.id}` : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white font-sans overflow-x-hidden selection:bg-brand-primary/20">
      
      {/* Top Navbar */}
      <header className="bg-transparent dark:bg-transparent pb-4 border-b border-slate-200 dark:border-slate-800/60 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <SolidButton
              onClick={handleBack}
              className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:block ml-2 text-sm font-bold">Back</span>
            </SolidButton>
            
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{course.title}</h1>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                 Lesson {sectionList.flatMap(s => s.lectures).findIndex(l => l.id === displayedLecture.id) + 1} of {totalLessons}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Course Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 sm:w-32 h-2 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary transition-all duration-500 rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">{course.progress}%</span>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <SolidButton
              className="xl:hidden h-10 px-4 rounded-xl bg-brand-primary text-white border-brand-primary hover:bg-brand-secondary ml-auto"
              onClick={() => setIsPlaylistOpen(true)}
              aria-label="Open Course Curriculum"
            >
              <Menu className="h-4 w-4 mr-2" />
              <span className="text-sm font-bold">Menu</span>
            </SolidButton>
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 xl:flex-row xl:items-start">
        
        {/* Left Column: Video & Tabs */}
        <div className="w-full xl:flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Main Video Section */}
          <SolidPanel className="border-none shadow-md bg-black">
            <div className="relative w-full aspect-video bg-black rounded-t-2xl overflow-hidden">
                <GlassPreviewPlayer
                  videoUrl={displayedLecture.videoUrl}
                  title={displayedLecture.title}
                  poster={course.thumbnail}
                />
            </div>
            
            {/* Video Controls Bar */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-4 sm:p-6 rounded-b-2xl">
              <div className="flex flex-col 2xl:flex-row items-start 2xl:items-center justify-between gap-5">
                <div className="flex-1 min-w-0 w-full pr-0 2xl:pr-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                    {displayedLecture.title}
                  </h2>
                  <div className="mt-3 flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300">
                      <Clock className="h-4 w-4" />
                      {displayedLecture.duration}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap justify-between w-full 2xl:w-auto items-center gap-3 shrink-0 mt-2 2xl:mt-0">
                  <SolidButton
                    onClick={markAsCompleted}
                    className={`flex-1 sm:flex-none h-11 px-4 sm:px-6 rounded-xl whitespace-nowrap
                      ${(user.progress?.[course.id] || []).includes(displayedLecture.id)
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:border-emerald-800/50 dark:text-emerald-400 font-bold'
                        : 'text-brand-primary border-slate-200 dark:border-slate-700 dark:hover:border-slate-600'
                      }`}
                    disabled={isCompleting}
                  >
                    {(user.progress?.[course.id] || []).includes(displayedLecture.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span>Completed</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 opacity-50" />
                        <span>Mark Complete</span>
                      </>
                    )}
                  </SolidButton>

                  <div className="flex gap-2 shrink-0">
                    <SolidButton
                      className="h-11 w-11 rounded-xl shrink-0"
                      title="Previous Lecture"
                      onClick={goToPrevLecture}
                      disabled={allLectures.findIndex(l => l.id === displayedLecture.id) <= 0}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </SolidButton>
                    <SolidButton
                      className="h-11 w-11 rounded-xl shrink-0"
                      title="Next Lecture"
                      onClick={goToNextLecture}
                      disabled={allLectures.findIndex(l => l.id === displayedLecture.id) >= allLectures.length - 1}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </SolidButton>
                  </div>
                </div>
              </div>
            </div>
          </SolidPanel>

          {/* Tab Navigation Section */}
          <SolidPanel>
            <div className="flex overflow-x-auto border-b border-slate-100 dark:border-slate-800 scrollbar-none snap-x text-sm font-bold">
              {navigationSections.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setActiveSection(item.label)}
                  className={`
                        flex-1 relative px-6 py-4 whitespace-nowrap transition-colors outline-none
                        ${activeSection === item.label
                      ? 'text-brand-primary border-b-2 border-brand-primary bg-slate-50 dark:bg-slate-800/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/20'
                    }
                      `}
                >
                  <div className="flex items-center justify-center gap-2">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 sm:p-8">
              {activeSection === 'Overview' && (
                <div className="space-y-8 max-w-4xl">
                  <div>
                    <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">About this Topic</h3>
                    <p className="text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                      {course.longDescription || course.description}
                    </p>
                  </div>

                  {course.learningOutcomes && (
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500" />
                        Key Takeaways
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-4">
                        {course.learningOutcomes.map((item, i) => (
                          <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300 text-sm font-medium">
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
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Downloadable Materials</h3>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{resourcesCount} Files</span>
                  </div>

                  {course.resources && course.resources.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {course.resources.map(res => (
                        <div key={res.id} onClick={() => window.open(res.url, '_blank')} className="group p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-primary hover:shadow-md cursor-pointer transition-all">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-brand-primary group-hover:scale-105 transition-transform">
                              <File className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate text-slate-800 dark:text-slate-100 group-hover:text-brand-primary transition-colors">{res.name}</p>
                              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">PDF Document</p>
                            </div>
                            <Download className="h-5 w-5 text-slate-300 dark:text-slate-500 group-hover:text-brand-primary transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-full mb-3 shadow-sm">
                         <Inbox className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                      </div>
                      <p className="font-semibold text-slate-500 dark:text-slate-400">No resources available just yet.</p>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'Add task' && (
                <div className="max-w-2xl">
                  <div className="relative mb-8">
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="What's your next goal?"
                      className="w-full pl-6 pr-32 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                    />
                    <button
                      onClick={handleAddTask}
                      className="absolute right-2 top-2 bottom-2 px-6 rounded-xl bg-slate-900 dark:bg-brand-primary text-white font-bold hover:opacity-90 transition-all shadow-md"
                    >
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group">
                        <button className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${task.status === 'Completed' ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-500 group-hover:border-brand-primary'}`} aria-label="Toggle task status">
                          {task.status === 'Completed' && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>
                        <span className={`text-base font-medium transition-all ${task.status === 'Completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && <p className="text-slate-500 dark:text-slate-400 font-medium italic">Start by adding a task above.</p>}
                  </div>
                </div>
              )}

              {activeSection === 'My doubts' && (
                <div className="max-w-2xl space-y-4">
                  <textarea
                    className="w-full p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all resize-none min-h-[160px] text-base font-medium text-slate-800 dark:text-white placeholder:text-slate-400"
                    placeholder="Ask a question about this lecture..."
                  />
                  <div className="flex justify-end">
                    <SolidButton className="px-8 h-12 rounded-xl bg-slate-900 border-slate-900 dark:bg-brand-primary dark:border-brand-primary text-white font-bold shadow-md hover:opacity-90">
                      Post Question
                    </SolidButton>
                  </div>
                </div>
              )}

              {activeSection === 'Simulations' && (
                <div className="space-y-6">
                  {course.simulations && course.simulations.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {course.simulations.map((sim) => (
                        <div key={sim.id} className="group relative overflow-hidden rounded-2xl bg-slate-900 p-8 text-white shadow-xl">
                          <div className="relative z-10">
                            <h4 className="text-xl font-bold mb-2">{sim.title}</h4>
                            <p className="text-slate-300 mb-6 text-sm font-medium leading-relaxed">{sim.description}</p>
                            <a
                              href={sim.launchUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-6 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-brand-light transition-all shadow-md"
                            >
                              Launch Simulation
                            </a>
                          </div>
                          {sim.thumbnail && (
                             <img
                               src={sim.thumbnail}
                               alt=""
                               className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay transition-transform duration-700 group-hover:scale-105"
                             />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm">
                         <Cpu className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200">No simulations active</h4>
                      <p className="text-sm text-slate-500 font-medium mt-1">Interactive labs for this course are coming soon.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </SolidPanel>
        </div>

        {/* Right Column: Playlist Sidebar */}
        <aside className={`
            fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800
            transition-transform duration-300 ease-out 
            xl:transform-none xl:static xl:w-[380px] xl:shadow-sm xl:rounded-2xl xl:border xl:bg-white xl:dark:bg-slate-900
            ${isPlaylistOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}
         `}>
          <div className="h-full flex flex-col xl:sticky xl:top-[88px] xl:max-h-[calc(100vh-120px)]">
            
            {/* Mobile Sidebar Header */}
            <div className="flex items-center justify-between p-5 xl:hidden border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Content</h2>
              <button onClick={() => setIsPlaylistOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close Menu">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Curriculum Header (Desktop) */}
            <div className="hidden xl:block p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Curriculum</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">{totalLessons} Lectures</p>
            </div>

            {/* Playlist Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              {sectionList.map((section, idx) => (
                <SectionSummary
                  key={idx}
                  section={section}
                  currentLectureId={currentLectureId ?? ''}
                  onSelect={handleSelectLecture}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile */}
        {isPlaylistOpen && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 xl:hidden transition-opacity"
            onClick={() => setIsPlaylistOpen(false)}
          />
        )}

      </main>
    </div>
  );
};

export default CourseLearnPage;

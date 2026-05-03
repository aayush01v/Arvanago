import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

import { db } from './firebase.ts';
import type {
  Course,
  CourseInstructor,
  CourseSection,
  CourseSocialLink,
  Lecture,
  SuggestedCourseSummary,
  Timestamp,
  User,
  BlogPost,
  Comment,
  Note,
  Coupon,
  Vault,
} from '../types.ts';

// Increased cache TTL for better performance
const COURSE_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes (was 5 minutes)
let cachedCourses: Course[] | null = null;
let coursesCacheTimestamp = 0;
let inflightCoursesPromise: Promise<Course[]> | null = null;

const defaultAuthor: User = {
  uid: 'default-author',
  name: 'EduSimulate Instructor',
  email: null,
  avatar: 'https://i.pravatar.cc/150?u=edusimulate-author',
  level: 5,
  points: 2500,
  streak: 42,
  completedChallenges: 18,
  enrolledCourses: [],
  ongoingCourses: [],
  wishlist: [],
  pendingTasks: [],
  bio: 'Instructor profiles will appear here once connected to Firestore.',
  coursesAuthored: 3,
  followers: 120,
  following: 15,
  postsCount: 5,
};

const FALLBACK_COURSE_SEEDS: ReadonlyArray<Course> = [
  {
    id: 'iit-jee-physics-foundations',
    title: 'IIT JEE Physics Foundations',
    description:
      'Strengthen your physics fundamentals with immersive visualisations, targeted assignments, and weekly live doubt solving.',
    category: 'IIT JEE',
    thumbnail: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
    isFree: true,
    isPaid: false,
    isPublished: true,
    isFeaturedOnHome: true,
    featuredPriority: 1,
    lectures: [
      {
        id: 'iit-jee-physics-foundations-lecture-1',
        title: 'Vectors & Motion',
        duration: '18m',
        videoUrl: 'https://player.vimeo.com/video/652519260',
        isCompleted: false,
        summary: 'Master the fundamentals of vectors and motion in a plane with guided problem walkthroughs.',
      },
      {
        id: 'iit-jee-physics-foundations-lecture-2',
        title: 'Newtonian Dynamics',
        duration: '22m',
        videoUrl: 'https://player.vimeo.com/video/652519261',
        isCompleted: false,
        summary: 'Tackle force and friction problems with live strategy breakdowns.',
      },
      {
        id: 'iit-jee-physics-foundations-lecture-3',
        title: 'Work, Power & Energy Labs',
        duration: '26m',
        videoUrl: 'https://player.vimeo.com/video/652519262',
        isCompleted: false,
        summary: 'Experiment with interactive energy conservation scenarios and timed drills.',
      },
    ],
    progress: 0,
    author: {
      ...defaultAuthor,
      uid: 'mentor-anika',
      name: 'Anika Sharma',
      avatar: 'https://i.pravatar.cc/150?u=mentor-anika',
      bio: 'Lead Physics Mentor, Ex-IIT Bombay',
    },
    price: 0,
    currency: 'INR',
    rating: 4.8,
    reviewCount: 1890,
    studentCount: 12500,
    lessonsCount: 48,
    totalDuration: '18h',
    skillLevel: 'Intermediate',
    views: 32000,
    subtitle: 'Daily problem-solving drills for confident ranks.',
    headline: 'Structured Physics prep for IIT JEE 2025 aspirants.',
    lastUpdated: '2024-07-10',
    updatedAt: '2024-07-10',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519260',
    previewImageUrl: 'https://images.unsplash.com/photo-1532105956626-9569c03602f6?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Apply mechanics concepts to multi-step questions.',
      'Decode frequently tested question patterns.',
      'Build speed with timed drills and live competitions.',
    ],
    requirements: [
      'Comfort with class 11 Physics basics.',
      'Notebook for derivations and problem-solving.',
    ],
    includes: [
      'Live doubt solving rooms',
      'Downloadable practice sheets',
      'Weekly mock tests',
    ],
    faqs: [
      {
        question: 'Will sessions be recorded?',
        answer: 'Yes, every live class is available on-demand within an hour.',
      },
      {
        question: 'Do I get personal mentorship?',
        answer: 'Dedicated mentors host weekly 1:1 strategy sessions.',
      },
    ],
    suggestedCourses: ['neet-biology-masterclass', 'upsc-answer-writing-lab'],
    tags: ['Physics', 'IIT JEE', 'Problem Solving'],
  },
  {
    id: 'neet-biology-masterclass',
    title: 'NEET Biology Masterclass',
    description:
      'Learn high-yield NCERT biology with mnemonics, live quizzes, and rapid revision notes designed for NEET toppers.',
    category: 'NEET',
    thumbnail: 'https://images.unsplash.com/photo-1559757175-5700dde6753d?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1559757175-5700dde6753d?auto=format&fit=crop&w=800&q=80',
    isFree: false,
    isPaid: true,
    isPublished: true,
    isFeaturedOnHome: true,
    featuredPriority: 2,
    lectures: [
      {
        id: 'neet-biology-masterclass-lecture-1',
        title: 'Plant Physiology Power Hour',
        duration: '20m',
        videoUrl: 'https://player.vimeo.com/video/652519270',
        isCompleted: false,
        summary: 'Visual mnemonics to master transport in plants and mineral nutrition.',
      },
      {
        id: 'neet-biology-masterclass-lecture-2',
        title: 'Human Reproduction Blueprint',
        duration: '24m',
        videoUrl: 'https://player.vimeo.com/video/652519271',
        isCompleted: false,
        summary: 'Decode frequently asked NEET questions with examiner tips.',
      },
      {
        id: 'neet-biology-masterclass-lecture-3',
        title: 'Genetics Rapid Revision',
        duration: '28m',
        videoUrl: 'https://player.vimeo.com/video/652519272',
        isCompleted: false,
        summary: 'Use story-based mnemonics to remember complex inheritance patterns.',
      },
    ],
    progress: 0,
    author: {
      ...defaultAuthor,
      uid: 'mentor-raghav',
      name: 'Dr. Raghav Menon',
      avatar: 'https://i.pravatar.cc/150?u=mentor-raghav',
      bio: 'Senior Biology Faculty, 12+ years of NEET mentoring.',
    },
    price: 5999,
    originalPrice: 8999,
    currency: 'INR',
    rating: 4.9,
    reviewCount: 2480,
    studentCount: 18200,
    lessonsCount: 60,
    totalDuration: '24h',
    skillLevel: 'Intermediate',
    views: 41000,
    subtitle: 'Complete NCERT coverage with daily active recall.',
    headline: 'Master every biology diagram and concept for NEET 2025.',
    lastUpdated: '2024-08-22',
    updatedAt: '2024-08-22',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519270',
    previewImageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde6753d?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Retain biology facts using smart mnemonics.',
      'Solve NCERT exemplar questions with confidence.',
      'Practice exam-level MCQs under time pressure.',
    ],
    requirements: [
      'Basic understanding of class 11 biology.',
      'Consistency to attempt daily practice quizzes.',
    ],
    includes: [
      '4000+ exam-style MCQs',
      'Rapid revision flashcards',
      'Daily live quizzes',
    ],
    faqs: [
      {
        question: 'Is this course aligned with NCERT?',
        answer: '100% NCERT coverage with additional PYQ focus sessions.',
      },
    ],
    suggestedCourses: ['iit-jee-physics-foundations', 'upsc-answer-writing-lab'],
    tags: ['Biology', 'NEET', 'NCERT'],
  },
  {
    id: 'upsc-answer-writing-lab',
    title: 'UPSC Answer Writing Lab',
    description: 'Upgrade your GS mains answers with live evaluation, peer reviews, and the 7-5-3 framework.',
    category: 'UPSC',
    thumbnail: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    isFree: false,
    isPaid: true,
    isPublished: true,
    isFeaturedOnHome: false,
    lectures: [
      {
        id: 'upsc-answer-writing-lab-lecture-1',
        title: '7-5-3 Framework Deep Dive',
        duration: '16m',
        videoUrl: 'https://player.vimeo.com/video/652519280',
        isCompleted: false,
        summary: 'Craft impactful introductions, body, and conclusions for GS answers.',
      },
      {
        id: 'upsc-answer-writing-lab-lecture-2',
        title: 'Daily Drill & Feedback Loop',
        duration: '21m',
        videoUrl: 'https://player.vimeo.com/video/652519281',
        isCompleted: false,
        summary: 'Learn how to internalise examiner expectations with iterative feedback.',
      },
      {
        id: 'upsc-answer-writing-lab-lecture-3',
        title: 'Case Study Closers',
        duration: '19m',
        videoUrl: 'https://player.vimeo.com/video/652519282',
        isCompleted: false,
        summary: 'Practise ethics case studies with structured approaches.',
      },
    ],
    progress: 0,
    author: {
      ...defaultAuthor,
      uid: 'mentor-isha',
      name: 'Isha Verma',
      avatar: 'https://i.pravatar.cc/150?u=mentor-isha',
      bio: 'Former Civil Servant & UPSC mentor.',
    },
    price: 2999,
    originalPrice: 4999,
    currency: 'INR',
    rating: 4.7,
    reviewCount: 980,
    studentCount: 6200,
    lessonsCount: 36,
    totalDuration: '15h',
    skillLevel: 'Advanced',
    views: 15200,
    subtitle: 'Craft high-scoring answers with actionable feedback.',
    headline: 'Daily writing drills, evaluated by former civil servants.',
    lastUpdated: '2024-06-18',
    updatedAt: '2024-06-18',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519280',
    previewImageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Structure GS answers for maximum impact.',
      'Practise answer writing under exam constraints.',
      'Internalise scoring rubrics with peer review.',
    ],
    requirements: [
      'Working knowledge of the GS syllabus.',
      'Commitment to daily writing practice.',
    ],
    includes: [
      'Weekly evaluated mocks',
      'Personalised feedback reports',
      'Live strategy workshops',
    ],
    faqs: [
      {
        question: 'Do I need an optional subject decided?',
        answer: 'Not necessary, but a clear GS foundation helps you apply feedback faster.',
      },
    ],
    suggestedCourses: ['iit-jee-physics-foundations'],
    tags: ['UPSC', 'Answer Writing', 'Mains'],
  },
  {
    id: 'JSJ23',
    title: 'Modern Javascript & Web Development',
    description: 'Master the web with a complete guide to HTML, CSS, and Modern Javascript (ES6+). Build real-world projects.',
    category: 'Programming',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80',
    isFree: false,
    isPaid: true,
    isPublished: true,
    isFeaturedOnHome: true,
    lectures: [
      {
        id: 'JSJ23-lec-1',
        title: 'HTML5 Semantic Structure',
        duration: '15m',
        videoUrl: 'https://player.vimeo.com/video/652519290',
        isCompleted: true,
        summary: 'Understanding the importance of semantic HTML for accessibility and SEO.',
        isPreview: true,
      },
      {
        id: 'JSJ23-lec-2',
        title: 'CSS Grid & Flexbox Mastery',
        duration: '25m',
        videoUrl: 'https://player.vimeo.com/video/652519291',
        isCompleted: false,
        summary: 'Build complex layouts easily with modern CSS layout modules.',
      },
      {
        id: 'JSJ23-lec-3',
        title: 'ES6+ Features: Arrow Fn & Destructuring',
        duration: '20m',
        videoUrl: 'https://player.vimeo.com/video/652519292',
        isCompleted: false,
        summary: 'Write clean and concise Javascript using the latest features.',
      },
      {
        id: 'JSJ23-lec-4',
        title: 'Async JS: Promises & Async/Await',
        duration: '30m',
        videoUrl: 'https://player.vimeo.com/video/652519293',
        isCompleted: false,
        summary: 'Handle asynchronous operations like API calls effectively.',
      },
    ],
    progress: 25,
    author: {
      ...defaultAuthor,
      uid: 'mentor-alex',
      name: 'Alex Dev',
      avatar: 'https://i.pravatar.cc/150?u=mentor-alex',
      bio: 'Full Stack Developer & Open Source Contributor.',
    },
    price: 3999,
    originalPrice: 6999,
    currency: 'INR',
    rating: 4.8,
    reviewCount: 3200,
    studentCount: 15400,
    lessonsCount: 42,
    totalDuration: '32h',
    skillLevel: 'Beginner',
    views: 28000,
    subtitle: 'From zero to full-stack hero.',
    headline: 'The comprehensive guide to becoming a modern web developer.',
    lastUpdated: '2024-09-15',
    updatedAt: '2024-09-15',
    language: 'English',
    previewVideoUrl: 'https://player.vimeo.com/video/652519290',
    previewImageUrl: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=800&q=80',
    learningOutcomes: [
      'Build responsive websites from scratch.',
      'Master JavaScript fundamentals and DOM manipulation.',
      'Deploy applications to the cloud.',
    ],
    requirements: ['No prior coding experience needed.', 'A computer with internet access.'],
    includes: ['Source code for all projects', 'Certificate of completion', 'Active Discord community'],
    faqs: [
      {
        question: 'Is this suitable for absolute beginners?',
        answer: 'Yes, we start from the very basics of how the web works.',
      },
    ],
    suggestedCourses: ['upsc-answer-writing-lab'],
    tags: ['Web Development', 'JavaScript', 'Frontend'],
    resources: [
      { id: 'res-1', name: 'Cheatsheet_HTML5.pdf', type: 'PDF', size: '1.2MB' },
      { id: 'res-2', name: 'CSS_Grid_Guide.pdf', type: 'PDF', size: '2.4MB' },
      { id: 'res-3', name: 'Starter_Code_v1.zip', type: 'ZIP', size: '5.6MB' }
    ]
  },
  {
    id: "web_dev_bootcamp",
    title: "Complete Web Dev Bootcamp: Basics to Advanced",
    category: "Web Development",
    description: "Master full-stack web development: HTML/CSS/JS, React, Node.js, and MongoDB.",
    longDescription: "A complete zero-to-hero bootcamp curated from top industry resources. Master the modern web stack starting with static HTML/CSS, moving to dynamic React frontends, and finishing with robust Node.js/MongoDB backends. Build real production-ready applications.",
    learningOutcomes: [
      "Build responsive websites with HTML5 & CSS3 (Flexbox/Grid)",
      "Master modern JavaScript (ES2025+) mechanics",
      "Create interactive UIs with React 19 & Hooks",
      "Develop RESTful APIs with Node.js & Express",
      "Manage data with MongoDB & Mongoose"
    ],
    thumbnail: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80",
    progress: 0,
    totalDuration: "15h 20m",
    rating: 4.9,
    studentCount: 3420,
    isPublished: true,
    author: {
      ...defaultAuthor,
      uid: 'mentor-angela',
      name: 'Angela Yu',
      avatar: 'https://i.pravatar.cc/150?u=mentor-angela',
      bio: 'Lead Instructor',
    },
    tags: ['Web Development', 'Full Stack', 'MERN'],
    lectures: [], // Populated from sections if needed, but required by type
    isPaid: true,
    isFree: false,
    price: 4999,
    currency: 'INR',
    resources: [
      {
        id: "r_wd_1",
        name: "VS Code Setup Guide",
        type: "PDF",
        size: "2.1MB",
        url: "https://example.com/resources/vscode_setup.pdf",
      },
      {
        id: "r_wd_2",
        name: "Final Project Assets",
        type: "ZIP",
        size: "15MB",
        url: "https://example.com/resources/project_assets.zip",
      }
    ],
    sections: [
      {
        title: "Phase 1: Beginner – Core Frontend",
        lectures: [
          {
            id: "wd_html",
            title: "HTML Fundamentals",
            duration: "31m",
            videoUrl: "https://www.youtube.com/embed/Gs5yi3Hi5qo",
            summary: "Covers semantic tags, forms, and accessibility from scratch. A perfect intro with modern best practices.",
            isCompleted: false,
            isPreview: true,
          },
          {
            id: "wd_css",
            title: "CSS Styling and Layouts",
            duration: "45m",
            videoUrl: "https://www.youtube.com/embed/QeslNHmTObk",
            summary: "Hands-on Flexbox/Grid, responsive design, and animations. Essential for mobile-first sites.",
            isCompleted: false,
            isPreview: false,
          },
          {
            id: "wd_js_basics",
            title: "JavaScript Basics",
            duration: "120m",
            videoUrl: "https://www.youtube.com/embed/ogdtB_m6G5g",
            summary: "Variables, Loops, Functions. Simple explanations with console demos. Builds a basic calculator.",
            isCompleted: false,
          }
        ],
      },
      {
        title: "Phase 2: Intermediate – Dynamic Frontend (React)",
        lectures: [
          {
            id: "wd_react_state",
            title: "React Components and State",
            duration: "20m",
            videoUrl: "https://www.youtube.com/embed/OA5JAmTcTz4",
            summary: "Quick setup with props and hooks. Great for transitioning from vanilla JS without boilerplate overwhelm.",
            isCompleted: false,
          },
          {
            id: "wd_react_hooks",
            title: "React Hooks and Routing",
            duration: "90m",
            videoUrl: "https://www.youtube.com/embed/TtPXvEcE11E",
            summary: "Deep dive into useState/useEffect and React Router. Includes building a Todo app.",
            isCompleted: false,
          }
        ],
      },
      {
        title: "Phase 3: Advanced – Backend and Full-Stack",
        lectures: [
          {
            id: "wd_node",
            title: "Node.js and Express Setup",
            duration: "60m",
            videoUrl: "https://www.youtube.com/embed/yGl3f0xTl_0",
            summary: "From npm init to REST APIs. Covers middleware and error handling for MERN stack starters.",
            isCompleted: false,
          },
          {
            id: "wd_mongo",
            title: "MongoDB for Web Apps",
            duration: "120m",
            videoUrl: "https://www.youtube.com/embed/Zndy6PfyLLM",
            summary: "CRUD ops, schemas with Mongoose, and aggregation. Integrates directly with Node.",
            isCompleted: false,
          },
          {
            id: "wd_mern",
            title: "Full-Stack MERN Project",
            duration: "120m",
            videoUrl: "https://www.youtube.com/embed/LzMnsfqjzkA",
            summary: "Build a complete blog app with React, Node, and MongoDB. Covers Auth (JWT) and deployment.",
            isCompleted: false,
          }
        ],
      }
    ],
  },
];

const cloneFallbackCourse = (course: Course, courseMap: Map<string, Course>): Course => {
  const lectures = course.lectures.map((lecture) => ({ ...lecture }));
  const sections = course.sections?.map((section) => ({
    ...section,
    lectures: section.lectures.map((lecture) => ({ ...lecture })),
  }));

  const suggestedCourseDetails = course.suggestedCourses
    ?.map((id) => {
      const suggested = courseMap.get(id);
      if (!suggested) {
        return null;
      }

      return {
        id: suggested.id,
        title: suggested.title,
        category: suggested.category,
        thumbnailUrl: suggested.thumbnailUrl ?? suggested.thumbnail,
        price: suggested.price,
        currency: suggested.currency,
        isPaid: suggested.isPaid,
        tags: suggested.tags,
      } as SuggestedCourseSummary;
    })
    .filter((detail): detail is SuggestedCourseSummary => Boolean(detail) && Boolean(detail.id));

  return {
    ...course,
    author: {
      ...course.author,
      ongoingCourses: [...course.author.ongoingCourses],
      wishlist: [...course.author.wishlist],
      pendingTasks: [...course.author.pendingTasks],
    },
    lectures,
    sections,
    suggestedCourseDetails:
      suggestedCourseDetails && suggestedCourseDetails.length > 0
        ? suggestedCourseDetails
        : course.suggestedCourseDetails,
  } satisfies Course;
};
const buildFallbackCourses = (): Course[] => {
  const courseMap = new Map(FALLBACK_COURSE_SEEDS.map((course) => [course.id, course]));
  return FALLBACK_COURSE_SEEDS.map((course) => cloneFallbackCourse(course, courseMap));
};

const shouldUseFallbackCourses = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: string }).code;
  if (typeof code === 'string') {
    return ['permission-denied', 'unavailable', 'failed-precondition'].includes(code);
  }

  const message = (error as { message?: string }).message;
  return typeof message === 'string' && message.toLowerCase().includes('missing or insufficient permissions');
};

const coerceBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return fallback;
};

const coerceNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const buildAuthor = (data: unknown): User => {
  if (!data || typeof data !== 'object') {
    return defaultAuthor;
  }

  const candidate = data as Partial<User> & { name?: string; avatar?: string; bio?: string };

  return {
    ...defaultAuthor,
    ...candidate,
    name: candidate.name ?? defaultAuthor.name,
    avatar: candidate.avatar ?? defaultAuthor.avatar,
    bio: candidate.bio ?? defaultAuthor.bio,
  };
};

const mapLecture = (lectureData: any, fallbackId: string): Lecture => ({
  id: lectureData?.id ?? fallbackId,
  title: lectureData?.title ?? 'Untitled Lecture',
  duration: lectureData?.duration ?? '5m',
  videoUrl: lectureData?.videoUrl ?? lectureData?.youtubeUrl ?? '',
  isCompleted: coerceBoolean(lectureData?.isCompleted),
  summary: lectureData?.summary ?? lectureData?.description ?? 'Summary coming soon.',
  isPreview: coerceBoolean(lectureData?.isPreview),
});

const fetchLecturesForCourse = async (
  courseRef: firebase.firestore.DocumentReference,
  fallbackLectures: unknown,
): Promise<Lecture[]> => {
  try {
    const snapshot = await courseRef.collection('lectures').get();
    if (!snapshot.empty) {
      return snapshot.docs.map((lectureDoc, index) =>
        mapLecture({ id: lectureDoc.id, ...lectureDoc.data() }, `${courseRef.id}-lecture-${index + 1}`),
      );
    }
  } catch (error) {
    console.warn(`Failed to load lectures for course "${courseRef.id}":`, error);
  }

  if (Array.isArray(fallbackLectures)) {
    return fallbackLectures.map((lecture, index) =>
      mapLecture(lecture, `${courseRef.id}-lecture-${index + 1}`),
    );
  }

  return [];
};

const buildSections = (lectures: Lecture[], sectionsData: unknown): CourseSection[] => {
  if (Array.isArray(sectionsData) && sectionsData.length > 0) {
    const validSections = sectionsData
      .map((section: any) => {
        if (!section || typeof section !== 'object') {
          return null;
        }

        const title = typeof section.title === 'string' ? section.title : 'Course Modules';
        const sectionLectures = Array.isArray(section.lectures)
          ? section.lectures.map((lecture: any, index: number) =>
            mapLecture(lecture, `${title}-lecture-${index + 1}`),
          )
          : lectures;

        return {
          title,
          lectures: sectionLectures,
          progress: typeof section.progress === 'number' ? section.progress : undefined,
        } as CourseSection;
      })
      .filter((section): section is CourseSection => Boolean(section));

    if (validSections.length > 0) {
      return validSections;
    }
  }

  return [
    {
      title: 'Course Modules',
      lectures,
      progress: lectures.length === 0 ? 0 : Math.round((lectures.filter(l => l.isCompleted).length / lectures.length) * 100),
    },
  ];
};

const sanitizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const cleaned = value.filter((item): item is string => typeof item === 'string');
  return cleaned.length > 0 ? cleaned : undefined;
};

const sanitizeSocialLinks = (value: unknown) => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { label?: unknown; url?: unknown; title?: unknown; href?: unknown };
      const label = typeof candidate.label === 'string' ? candidate.label : typeof candidate.title === 'string' ? candidate.title : undefined;
      const url = typeof candidate.url === 'string' ? candidate.url : typeof candidate.href === 'string' ? candidate.href : undefined;

      if (!label || !url) {
        return null;
      }

      return { label, url } satisfies CourseSocialLink;
    })
    .filter((link): link is CourseSocialLink => Boolean(link));

  return links.length > 0 ? links : undefined;
};

const sanitizeInstructors = (value: unknown): CourseInstructor[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const instructors = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Partial<CourseInstructor> & {
        id?: unknown;
        name?: unknown;
        title?: unknown;
        avatar?: unknown;
        rating?: unknown;
        totalStudents?: unknown;
        totalReviews?: unknown;
        bio?: unknown;
        headline?: unknown;
        description?: unknown;
        socialLinks?: unknown;
      };

      const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0 ? candidate.id : `instructor-${index + 1}`;
      const name = typeof candidate.name === 'string' ? candidate.name : undefined;

      if (!name) {
        return null;
      }

      const parsed: CourseInstructor = {
        id,
        name,
        title: typeof candidate.title === 'string' ? candidate.title : undefined,
        headline: typeof candidate.headline === 'string' ? candidate.headline : undefined,
        avatar: typeof candidate.avatar === 'string' ? candidate.avatar : undefined,
        rating: typeof candidate.rating === 'number' ? candidate.rating : undefined,
        totalStudents: typeof candidate.totalStudents === 'number' ? candidate.totalStudents : undefined,
        totalReviews: typeof candidate.totalReviews === 'number' ? candidate.totalReviews : undefined,
        bio: typeof candidate.bio === 'string' ? candidate.bio : undefined,
        description: typeof candidate.description === 'string' ? candidate.description : undefined,
        socialLinks: sanitizeSocialLinks(candidate.socialLinks),
      };

      return parsed;
    })
    .filter((instructor): instructor is CourseInstructor => Boolean(instructor));

  return instructors.length > 0 ? instructors : undefined;
};


export const getUserNotes = async (userId: string): Promise<Note[]> => {
  if (!userId) return [];

  try {
    const snapshot = await db.collection('users').doc(userId).collection('notes').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Note));
  } catch (error) {
    console.warn(`Failed to fetch notes for user ${userId}, returning empty list.`, error);
    return [];
  }
};

const sanitizeDescriptionSections = (
  value: unknown,
): NonNullable<Course['descriptionSections']> | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sections = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { title?: unknown; heading?: unknown; content?: unknown; description?: unknown };
      const content = typeof candidate.content === 'string' ? candidate.content : typeof candidate.description === 'string' ? candidate.description : undefined;

      if (!content) {
        return null;
      }

      const title = typeof candidate.title === 'string' ? candidate.title : typeof candidate.heading === 'string' ? candidate.heading : undefined;

      if (!title) return null;

      return {
        title,
        content: content.trim(),
      };
    })
    .filter((section): section is { title: string; content: string } => Boolean(section));

  return sections.length > 0 ? sections : undefined;
};

const formatMonthYear = (date: Date): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date);

const resolveUpdatedAtLabel = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (value instanceof Date) {
    return formatMonthYear(value);
  }

  if (value instanceof firebase.firestore.Timestamp) {
    return formatMonthYear(value.toDate());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatMonthYear(new Date(value));
  }

  if (typeof value === 'object' && value && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return formatMonthYear(date);
    } catch (error) {
      console.warn('Unable to parse Firestore timestamp-like object for updatedAt field.', error);
    }
  }

  return undefined;
};

const sanitizeDescription = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > 0 ? normalized : undefined;
};

const resolveCourseDescription = (
  courseId: string,
  rawData: Record<string, unknown>,
): string => {
  const candidateDescriptions: unknown[] = [
    rawData.description,
    rawData.shortDescription,
    rawData.summary,
  ];

  if (rawData.details && typeof rawData.details === 'object') {
    const details = rawData.details as Record<string, unknown>;
    candidateDescriptions.push(details.description, details.summary, details.overview);
  }

  if (rawData.meta && typeof rawData.meta === 'object') {
    const meta = rawData.meta as Record<string, unknown>;
    candidateDescriptions.push(meta.description);
  }

  for (const candidate of candidateDescriptions) {
    const sanitized = sanitizeDescription(candidate);
    if (sanitized) {
      return sanitized;
    }
  }

  console.warn(
    `Course "${courseId}" is missing a usable description field. Falling back to placeholder.`,
    {
      availableKeys: Object.keys(rawData),
    },
  );

  return 'Detailed course descriptions will appear once provided.';
};

const sanitizeSuggestedCourseIds = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const ids = value
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as { id?: unknown; courseId?: unknown };

      if (typeof candidate.id === 'string') {
        return candidate.id;
      }

      if (typeof candidate.courseId === 'string') {
        return candidate.courseId;
      }

      return null;
    })
    .filter((id): id is string => Boolean(id));

  return ids.length > 0 ? ids : undefined;
};

const sanitizeFaqs = (value: unknown): { question: string; answer: string }[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const faqs = value
    .map((item: any) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const question = typeof item.question === 'string' ? item.question : null;
      const answer = typeof item.answer === 'string' ? item.answer : null;

      if (!question || !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is { question: string; answer: string } => Boolean(item));

  return faqs.length > 0 ? faqs : undefined;
};

const sanitizeComments = (value: unknown): Course['comments'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const comments = value
    .map((comment: any) => {
      if (!comment || typeof comment !== 'object') {
        return null;
      }

      const id = typeof comment.id === 'string' ? comment.id : undefined;
      const text = typeof comment.text === 'string' ? comment.text : undefined;
      const timestamp = typeof comment.timestamp === 'string' ? comment.timestamp : undefined;
      const user = comment.user;

      if (!id || !text || !timestamp || !user || typeof user !== 'object') {
        return null;
      }

      const name = typeof user.name === 'string' ? user.name : undefined;
      const avatar = typeof user.avatar === 'string' ? user.avatar : undefined;

      if (!name || !avatar) {
        return null;
      }

      return {
        id,
        text,
        timestamp,
        user: { name, avatar },
      };
    })
    .filter((comment): comment is NonNullable<Course['comments']>[number] => Boolean(comment));

  return comments.length > 0 ? comments : undefined;
};

const sanitizeResources = (value: unknown): Course['resources'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const resources = value
    .map((resource: any) => {
      if (!resource || typeof resource !== 'object') {
        return null;
      }

      const id = typeof resource.id === 'string' ? resource.id : undefined;
      const name = typeof resource.name === 'string' ? resource.name : undefined;
      const type = resource.type;
      const size = typeof resource.size === 'string' ? resource.size : undefined;

      const url = typeof resource.url === 'string' ? resource.url : undefined;

      if (!id || !name || !size || (type !== 'PDF' && type !== 'ZIP' && type !== 'Blend File')) {
        return null;
      }

      return {
        id,
        name,
        type,
        size,
        ...(url ? { url } : {}),
      };
    })
    .filter((resource): resource is NonNullable<Course['resources']>[number] => Boolean(resource));

  return resources.length > 0 ? resources : undefined;
};

const allowedSkillLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;
type AllowedSkillLevel = (typeof allowedSkillLevels)[number];

const normalizeSkillLevel = (value: unknown): AllowedSkillLevel | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }

  const match = allowedSkillLevels.find(
    level => level.toLowerCase() === normalized.toLowerCase(),
  );

  return match;
};

const hydrateCourseFromDoc = async (
  courseDoc: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>,
  includeDrafts: boolean = false,
): Promise<Course | null> => {
  const rawData = courseDoc.data();

  if (!rawData || Object.keys(rawData).length === 0) {
    return null;
  }

  const isPublished = coerceBoolean(rawData.isPublished, true);
  if (!isPublished && !includeDrafts) {
    return null;
  }

  const lectures = await fetchLecturesForCourse(courseDoc.ref, rawData.lectures);
  const sections = buildSections(lectures, rawData.sections);
  const completedLectures = lectures.filter(lecture => lecture.isCompleted).length;
  const lessonsCount = lectures.length;
  const progress = lessonsCount > 0 ? Math.round((completedLectures / lessonsCount) * 100) : 0;

  const price = coerceNumber(rawData.price);
  const originalPrice = coerceNumber(rawData.originalPrice);
  const rating = typeof rawData.rating === 'number' ? rawData.rating : undefined;
  const reviewCount = typeof rawData.reviewCount === 'number' ? rawData.reviewCount : undefined;
  const studentCount = typeof rawData.studentCount === 'number' ? rawData.studentCount : undefined;
  const totalDuration = typeof rawData.totalDuration === 'string' ? rawData.totalDuration : undefined;
  const skillLevel = normalizeSkillLevel(rawData.skillLevel) ?? normalizeSkillLevel(rawData.level);
  const views = typeof rawData.views === 'number' ? rawData.views : undefined;
  const thumbnailUrl =
    typeof rawData.thumbnailUrl === 'string' && rawData.thumbnailUrl.trim().length > 0
      ? rawData.thumbnailUrl
      : typeof rawData.thumbnail === 'string'
        ? rawData.thumbnail
        : `https://picsum.photos/seed/${courseDoc.id}/640/360`;
  const tags = sanitizeStringArray(rawData.tags) ?? [];
  const includesFromRaw = sanitizeStringArray(rawData.includes);
  const courseIncludes =
    sanitizeStringArray(rawData.courseIncludes) ??
    sanitizeStringArray(rawData.features) ??
    includesFromRaw;
  const learningOutcomes =
    sanitizeStringArray(rawData.whatYouWillLearn) ??
    sanitizeStringArray(rawData.learningOutcomes) ??
    sanitizeStringArray(rawData.outcomes) ??
    sanitizeStringArray(rawData.objectives) ??
    (courseIncludes && courseIncludes !== includesFromRaw ? courseIncludes : undefined);
  const requirements =
    sanitizeStringArray(rawData.requirements) ??
    sanitizeStringArray(rawData.prerequisites);

  const details =
    rawData.details && typeof rawData.details === 'object'
      ? (rawData.details as Record<string, unknown>)
      : undefined;

  const pickHtmlString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? value : undefined;
  };

  const longDescription =
    sanitizeDescription(rawData.longDescription) ??
    sanitizeDescription(rawData.fullDescription) ??
    (details ? sanitizeDescription(details['longDescription']) ?? sanitizeDescription(details['descriptionLong']) : undefined);

  const descriptionHtml =
    pickHtmlString(rawData.descriptionHtml) ??
    pickHtmlString(rawData.htmlDescription) ??
    (details ? pickHtmlString(details['descriptionHtml']) : undefined);

  const descriptionSections =
    sanitizeDescriptionSections(rawData.descriptionSections) ??
    (details ? sanitizeDescriptionSections(details['sections']) : undefined);

  const subtitle = typeof rawData.subtitle === 'string' ? rawData.subtitle : undefined;
  const headline =
    typeof rawData.headline === 'string'
      ? rawData.headline
      : typeof rawData.tagline === 'string'
        ? rawData.tagline
        : subtitle;

  const updatedAtRaw = rawData.updatedAt ?? rawData.lastUpdated ?? rawData.updatedOn ?? rawData.modifiedAt;
  const updatedAt = resolveUpdatedAtLabel(updatedAtRaw);
  const language =
    typeof rawData.language === 'string' && rawData.language.trim().length > 0
      ? rawData.language.trim()
      : typeof rawData.locale === 'string' && rawData.locale.trim().length > 0
        ? rawData.locale.trim()
        : undefined;

  const previewVideoUrl =
    typeof rawData.previewVideoUrl === 'string'
      ? rawData.previewVideoUrl
      : typeof rawData.previewUrl === 'string'
        ? rawData.previewUrl
        : typeof rawData.previewURL === 'string'
          ? rawData.previewURL
          : typeof rawData.previewVideo === 'string'
            ? rawData.previewVideo
            : undefined;

  const previewImageUrl =
    typeof rawData.previewImageUrl === 'string'
      ? rawData.previewImageUrl
      : typeof rawData.previewImage === 'string'
        ? rawData.previewImage
        : typeof rawData.previewThumbnail === 'string'
          ? rawData.previewThumbnail
          : undefined;

  const instructors = sanitizeInstructors(rawData.instructors ?? rawData.authors);

  const hasExplicitIsPaid = typeof rawData.isPaid === 'boolean';
  const hasExplicitIsFree = typeof rawData.isFree === 'boolean';
  const inferredIsPaid = hasExplicitIsPaid
    ? (rawData.isPaid as boolean)
    : hasExplicitIsFree
      ? !(rawData.isFree as boolean)
      : price != null;
  const isPaid = coerceBoolean(inferredIsPaid, false);
  const isFree = hasExplicitIsFree ? (rawData.isFree as boolean) : !isPaid;
  const currency =
    typeof rawData.currency === 'string' && rawData.currency.trim().length > 0
      ? rawData.currency.trim().toUpperCase()
      : price != null
        ? 'USD'
        : undefined;
  const isFeaturedOnHome = coerceBoolean(rawData.isFeaturedOnHome);
  const featuredPriority = coerceNumber(rawData.featuredPriority);

  const suggestedCourseIds = sanitizeSuggestedCourseIds(rawData.suggestedCourses);

  return {
    id: typeof rawData.id === 'string' ? rawData.id : courseDoc.id,
    title: typeof rawData.title === 'string' ? rawData.title : 'Untitled Course',
    description: resolveCourseDescription(courseDoc.id, rawData as Record<string, unknown>),
    category: typeof rawData.category === 'string' ? rawData.category : 'General',
    thumbnail: thumbnailUrl,
    thumbnailUrl,
    isFree,
    isPaid,
    isPublished,
    isFeaturedOnHome,
    featuredPriority,
    lectures,
    sections,
    progress: typeof rawData.progress === 'number' ? rawData.progress : progress,
    author: buildAuthor(rawData.author),
    price,
    currency,
    originalPrice,
    rating,
    reviewCount,
    studentCount,
    lessonsCount,
    totalDuration,
    skillLevel,
    views,
    subtitle,
    headline,
    lastUpdated: updatedAt,
    updatedAt: updatedAt ?? (typeof rawData.updatedAt === 'string' ? rawData.updatedAt : undefined),
    language,
    previewVideoUrl,
    previewImageUrl: previewImageUrl ?? thumbnailUrl,
    learningOutcomes,
    requirements,
    longDescription,
    descriptionHtml,
    descriptionSections,
    instructors,
    includes: courseIncludes ?? includesFromRaw,
    faqs: sanitizeFaqs(rawData.faqs),
    suggestedCourses: suggestedCourseIds,
    lectureType: typeof rawData.lectureType === 'string' ? rawData.lectureType : undefined,
    critiqueSession: typeof rawData.critiqueSession === 'string' ? rawData.critiqueSession : undefined,
    tags,
    comments: sanitizeComments(rawData.comments),
    resources: sanitizeResources(rawData.resources),
    simulations: sanitizeSimulations(rawData.simulations),
  } satisfies Course;
};

const sanitizeSimulations = (value: unknown): Course['simulations'] => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const simulations = value
    .map((item: any) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const id = typeof item.id === 'string' ? item.id : undefined;
      const title = typeof item.title === 'string' ? item.title : undefined;
      const description = typeof item.description === 'string' ? item.description : undefined;
      const thumbnail = typeof item.thumbnail === 'string' ? item.thumbnail : undefined;
      const launchUrl = typeof item.launchUrl === 'string' ? item.launchUrl : undefined;
      const type = item.type;

      if (!id || !title || !description || !thumbnail || !launchUrl || (type !== '3D' && type !== 'Lab' && type !== 'Quiz')) {
        return null;
      }

      return { id, title, description, thumbnail, launchUrl, type };
    })
    .filter((sim): sim is NonNullable<Course['simulations']>[number] => Boolean(sim));

  return simulations.length > 0 ? simulations : undefined;
};

const collectCourseDocuments = async (): Promise<
  firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[]
> => {
  // Correctly query the 'courses' collection directly.
  // The 'lectures' collection does not exist at the root in the provided schema.
  const coursesSnapshot = await db.collection('courses').get();
  return [...coursesSnapshot.docs];
};

export const getOrCreateUser = async (
  uid: string,
  displayName: string | null,
  email: string | null,
  photoURL?: string | null,
): Promise<User> => {
  const userRef = db.collection('users').doc(uid);
  // Fetch admin doc separately with a fallback — non-admin users may get a
  // "Missing or insufficient permissions" error on this read if Firestore rules
  // are evaluated before the auth token is fully propagated after sign-in.
  const [userSnap, adminSnap] = await Promise.all([
    userRef.get(),
    db.collection('admins').doc(uid).get().catch(() => ({ exists: false, data: () => undefined })),
  ]);

  const isAdmin = adminSnap.exists;
  const adminRole = isAdmin ? (adminSnap.data()?.role || 'admin') : 'student';

  if (userSnap.exists) {
    const firestoreData = userSnap.data()!;
    const lastLogin = firestoreData.lastLogin as Timestamp | null;
    const themePreference: 'light' | 'dark' = firestoreData.themePreference === 'dark' ? 'dark' : 'light';
    let newStreak = firestoreData.streak || 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (lastLogin) {
      const lastLoginDate = lastLogin.toDate();
      const lastLoginDay = new Date(
        lastLoginDate.getFullYear(),
        lastLoginDate.getMonth(),
        lastLoginDate.getDate(),
      );

      const diffTime = today.getTime() - lastLoginDay.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        newStreak++;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updates: Record<string, unknown> = {
      lastLogin: firebase.firestore.Timestamp.now(),
      streak: newStreak,
    };

    if (!firestoreData.themePreference) {
      updates.themePreference = themePreference;
    }

    const isDefaultAvatar = firestoreData.avatar?.includes('pravatar.cc');
    if (photoURL && (!firestoreData.avatar || isDefaultAvatar)) {
      updates.avatar = photoURL;
    }



    // Always sync role if admin status changes (though typically admins are manually managed)
    if (isAdmin && firestoreData.role !== adminRole) {
      updates.role = adminRole;
    }

    // Check deleted status
    if (firestoreData.isDeleted) {
      throw new Error('This account has been deleted.');
    }

    if (firestoreData.isDisabled) {
      // Check for time-based suspension
      if (firestoreData.disabledUntil) {
        const now = new Date();
        const disabledUntilDate = firestoreData.disabledUntil.toDate();

        if (now < disabledUntilDate) {
          const dateStr = new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
          }).format(disabledUntilDate);
          throw new Error(`Your account is suspended until ${dateStr}.`);
        } else {
          // Suspension expired - Auto-enable
          updates.isDisabled = false;
          updates.disabledUntil = null;
          firestoreData.isDisabled = false; // Update local var for return
        }
      } else {
        // Indefinite suspension
        throw new Error('Your account has been disabled by an administrator.');
      }
    }

    await userRef.update(updates);

    return {
      uid,
      name: firestoreData.name || displayName || 'New Learner',
      email: firestoreData.email || email,
      avatar: (updates.avatar as string | undefined) || firestoreData.avatar || `https://i.pravatar.cc/150?u=${uid}`,
      level: firestoreData.level || 1,
      points: firestoreData.points || 0,
      completedChallenges: firestoreData.completedChallenges || 0,
      enrolledCourses: firestoreData.enrolledCourses || [],
      ongoingCourses: firestoreData.ongoingCourses || [],
      wishlist: firestoreData.wishlist || [],
      pendingTasks: firestoreData.pendingTasks || [],
      bio: firestoreData.bio,
      coursesAuthored: firestoreData.coursesAuthored,
      streak: newStreak,
      lastLogin: updates.lastLogin as Timestamp,
      isDisabled: firestoreData.isDisabled,
      disabledUntil: (updates.disabledUntil !== undefined ? updates.disabledUntil : firestoreData.disabledUntil) || null,
      isDeleted: firestoreData.isDeleted,

      themePreference,
      role: (updates.role as 'student' | 'admin' | 'super_admin' | undefined) || firestoreData.role || (isAdmin ? adminRole : 'student'),

      // New Profile Fields
      username: firestoreData.username || '',
      followers: firestoreData.followers || 0,
      following: firestoreData.following || 0,
      postsCount: firestoreData.postsCount || 0,
      coverPhoto: firestoreData.coverPhoto || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
      jobTitle: firestoreData.jobTitle || 'Learner',
      gallery: firestoreData.gallery || [],
      socialLinks: firestoreData.socialLinks || [],
    } satisfies User;
  }

  const newUser: User = {
    uid,
    name: displayName || 'New Learner',
    email,
    avatar: photoURL || `https://i.pravatar.cc/150?u=${uid}`,
    level: 1,
    points: 0,
    streak: 1,
    completedChallenges: 0,
    enrolledCourses: [],
    ongoingCourses: [],
    wishlist: [],
    pendingTasks: [],
    lastLogin: firebase.firestore.Timestamp.now(),
    // New Profile Defaults
    followers: 0,
    following: 0,
    postsCount: 0,
    username: '',
    coverPhoto: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    jobTitle: 'Learner',
    bio: 'Ready to learn!',
    socialLinks: [],
    gallery: [],

    themePreference: 'light',
    role: isAdmin ? adminRole : 'student',
  };

  await userRef.set(newUser);
  return newUser;
};

export const updateUserThemePreference = async (uid: string, theme: 'light' | 'dark'): Promise<void> => {
  const userRef = db.collection('users').doc(uid);
  await userRef.set({ themePreference: theme }, { merge: true });
};

export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  const userRef = db.collection('users').doc(uid);
  await userRef.update(updates);
};

export const requestAccountDeletion = async (uid: string): Promise<void> => {
  const userRef = db.collection('users').doc(uid);
  await userRef.update({
    deletionRequested: true,
    deletionRequestedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

// --- Follow System ---

export const isFollowingUser = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
  try {
    const doc = await db.collection('users').doc(currentUserId).collection('following').doc(targetUserId).get();
    return doc.exists;
  } catch (error) {
    console.error("Error checking follow status:", error);
    return false;
  }
};

export const followUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const batch = db.batch();

  // 1. Add target to my 'following'
  const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);
  batch.set(followingRef, { timestamp: firebase.firestore.FieldValue.serverTimestamp() });

  // 2. Add me to target's 'followers'
  const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);
  batch.set(followerRef, { timestamp: firebase.firestore.FieldValue.serverTimestamp() });

  await batch.commit();
};

export const unfollowUser = async (currentUserId: string, targetUserId: string): Promise<void> => {
  const batch = db.batch();

  // 1. Remove target from my 'following'
  const followingRef = db.collection('users').doc(currentUserId).collection('following').doc(targetUserId);
  batch.delete(followingRef);

  // 2. Remove me from target's 'followers'
  const followerRef = db.collection('users').doc(targetUserId).collection('followers').doc(currentUserId);
  batch.delete(followerRef);

  await batch.commit();
};

export const getFollowCounts = async (userId: string): Promise<{ followers: number; following: number }> => {
  const userRef = db.collection('users').doc(userId);
  const [followersSnapshot, followingSnapshot] = await Promise.all([
    userRef.collection('followers').get(),
    userRef.collection('following').get(),
  ]);

  return {
    followers: followersSnapshot.size,
    following: followingSnapshot.size,
  };
};

// --- Post System ---

export const createPost = async (userId: string, user: { name: string, username: string, avatar: string }, content: string, imageUrl?: string): Promise<string> => {
  const postRef = db.collection('posts').doc();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();

  await postRef.set({
    id: postRef.id,
    userId,
    user,
    content,
    imageUrl: imageUrl || null,
    likes: 0,
    commentsCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  // Increment user's post count
  await db.collection('users').doc(userId).update({
    postsCount: firebase.firestore.FieldValue.increment(1)
  });

  return postRef.id;
};

export const updatePost = async (postId: string, content: string, imageUrl?: string): Promise<void> => {
  await db.collection('posts').doc(postId).update({
    content,
    imageUrl: imageUrl || null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

export const deletePost = async (postId: string, userId: string): Promise<void> => {
  await db.collection('posts').doc(postId).delete();
  // Decrement user's post count
  await db.collection('users').doc(userId).update({
    postsCount: firebase.firestore.FieldValue.increment(-1)
  });
};

export const getUserPosts = async (userId: string): Promise<import('../types').Post[]> => {
  const snapshot = await db.collection('posts')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => doc.data() as import('../types').Post);
};

export const getFollowers = async (userId: string): Promise<User[]> => {
  const snapshot = await db.collection('users').doc(userId).collection('followers').get();
  const followerIds = snapshot.docs.map(doc => doc.id);
  return getUsersByIds(followerIds);
};

export const getFollowing = async (userId: string): Promise<User[]> => {
  const snapshot = await db.collection('users').doc(userId).collection('following').get();
  const followingIds = snapshot.docs.map(doc => doc.id);
  return getUsersByIds(followingIds);
};

export const getUsersByIds = async (userIds: string[]): Promise<User[]> => {
  if (userIds.length === 0) return [];
  // Firestore 'in' query supports up to 10 items. For simplicity/robustness, we'll promise.all here for now or chunk it.
  // Given the constraints and likely small scale, fetching individually or in chunks is safer than 'in' limits.
  // However, to be efficient for small numbers:
  const users: User[] = [];
  const chunks = [];
  for (let i = 0; i < userIds.length; i += 10) {
    chunks.push(userIds.slice(i, i + 10));
  }

  for (const chunk of chunks) {
    const snapshot = await db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
    snapshot.docs.forEach(doc => users.push(doc.data() as User));
  }
  return users;
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const variations = [username];
    // If starts with lowercase, try Capitalized (e.g. jeulix -> Jeulix)
    if (/^[a-z]/.test(username)) {
      variations.push(username.charAt(0).toUpperCase() + username.slice(1));
    }
    // If has uppercase, try all lowercase (e.g. Jeulix -> jeulix)
    if (/[A-Z]/.test(username)) {
      variations.push(username.toLowerCase());
    }
    const uniqueVars = Array.from(new Set(variations));

    const snapshot = await db.collection('users').where('username', 'in', uniqueVars).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { uid: doc.id, ...doc.data() } as User;
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return null;
  }
};

export const getLeaderboard = async (limit = 50): Promise<User[]> => {
  try {
    const snapshot = await db.collection('users')
      .orderBy('points', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
};

export const getCourses = async ({ forceRefresh = false, includeDrafts = false }: { forceRefresh?: boolean; includeDrafts?: boolean } = {}): Promise<Course[]> => {
  const now = Date.now();

  if (!forceRefresh && cachedCourses && now - coursesCacheTimestamp < COURSE_CACHE_TTL_MS) {
    return cachedCourses;
  }

  if (!forceRefresh && inflightCoursesPromise) {
    return inflightCoursesPromise;
  }

  if (forceRefresh) {
    cachedCourses = null;
    coursesCacheTimestamp = 0;
  }

  const loadCourses = async (): Promise<Course[]> => {
    try {
      const documents = await collectCourseDocuments();
      if (documents.length === 0) {
        cachedCourses = [];
        coursesCacheTimestamp = Date.now();
        return [];
      }

      const hydratedCourses = await Promise.all(documents.map(doc => hydrateCourseFromDoc(doc, includeDrafts)));
      const courseMap = new Map<string, Course>();

      hydratedCourses.forEach((course) => {
        if (!course) {
          return;
        }

        courseMap.set(course.id, course);
      });

      const coursesArray = Array.from(courseMap.values());

      coursesArray.forEach((course) => {
        if (!course.suggestedCourses?.length) {
          return;
        }

        const details = course.suggestedCourses
          .map((id) => courseMap.get(id))
          .filter((suggested): suggested is Course => Boolean(suggested))
          .map((suggested): SuggestedCourseSummary => ({
            id: suggested.id,
            title: suggested.title,
            category: suggested.category,
            thumbnailUrl: suggested.thumbnailUrl ?? suggested.thumbnail,
            price: suggested.price,
            currency: suggested.currency,
            isPaid: suggested.isPaid,
            tags: suggested.tags,
          }));

        if (details.length > 0) {
          course.suggestedCourseDetails = details;
        }
      });

      cachedCourses = coursesArray;
      coursesCacheTimestamp = Date.now();
      return coursesArray;
    } catch (error) {
      console.error('Failed to load courses from Firestore.', error);

      if (shouldUseFallbackCourses(error)) {
        console.info('Falling back to bundled sample courses because Firestore access is restricted.');
        const fallbackCourses = buildFallbackCourses();
        cachedCourses = fallbackCourses;
        coursesCacheTimestamp = Date.now();
        return fallbackCourses;
      }

      throw error;
    }
  };

  const requestPromise = loadCourses().finally(() => {
    inflightCoursesPromise = null;
  });

  if (!forceRefresh) {
    inflightCoursesPromise = requestPromise;
  }

  return requestPromise;
};

export const clearCoursesCache = (): void => {
  cachedCourses = null;
  coursesCacheTimestamp = 0;
  inflightCoursesPromise = null;
};

// ==========================================
// ADMIN FUNCTIONS
// ==========================================

import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// Helper to remove undefined fields which Firestore doesn't allow
const sanitizeFirestoreData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item)).filter(item => item !== undefined);
  }
  if (data !== null && typeof data === 'object') {
    // If it's a Date, return it as is (or ISO string if preferred, but Firestore supports Dates)
    if (data instanceof Date) return data;

    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitizeFirestoreData(v)])
    );
  }
  return data;
};

export const createCourse = async (courseData: Partial<Course>): Promise<string> => {
  try {
    // Basic validation
    if (!courseData.title) throw new Error('Course title is required');

    const newCourseData = {
      ...courseData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Default values for required fields if missing
      rating: 0,
      studentCount: 0,
      reviewCount: 0,
      sections: courseData.sections || [],
      simulations: courseData.simulations || [],
      resources: courseData.resources || [],
      isPublished: courseData.isPublished ?? false,
      isFree: courseData.isFree ?? false,
      isPaid: courseData.isPaid ?? true,
    };

    const sanitizedData = sanitizeFirestoreData(newCourseData);
    const docRef = await addDoc(collection(db, 'courses'), sanitizedData);
    clearCoursesCache();
    return docRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: string, updates: Partial<Course>): Promise<void> => {
  try {
    const docRef = doc(db, 'courses', courseId);
    const sanitizedUpdates = sanitizeFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(docRef, sanitizedUpdates);
    clearCoursesCache();
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'courses', courseId));
    clearCoursesCache();
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};
// ==========================================
// BLOG SYSTEM
// ==========================================

export const getBlogPosts = async (limitCount = 10, lastDoc?: firebase.firestore.QueryDocumentSnapshot): Promise<{ posts: BlogPost[], lastDoc?: firebase.firestore.QueryDocumentSnapshot }> => {
  let query = db.collection('blog_posts')
    .where('isPublished', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(limitCount);

  if (lastDoc) {
    query = query.startAfter(lastDoc);
  }

  const snapshot = await query.get();
  const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));

  return {
    posts,
    lastDoc: snapshot.docs[snapshot.docs.length - 1]
  };
};

export const getAllBlogPostsAdmin = async (): Promise<BlogPost[]> => {
  const snapshot = await db.collection('blog_posts')
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost));
};

export const getBlogPost = async (id: string): Promise<BlogPost | null> => {
  const doc = await db.collection('blog_posts').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as BlogPost;
};

export const createBlogPost = async (data: Partial<BlogPost>): Promise<string> => {
  const docRef = await db.collection('blog_posts').add({
    ...data,
    likes: 0,
    commentsCount: 0,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  return docRef.id;
};

export const createBlogPostWithId = async (id: string, data: Partial<BlogPost>): Promise<void> => {
  await db.collection('blog_posts').doc(id).set({
    ...data,
    likes: data.likes || 0, // Preserve likes if migrated, or 0
    commentsCount: data.commentsCount || 0,
    createdAt: data.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
};

export const updateBlogPost = async (id: string, data: Partial<BlogPost>): Promise<void> => {
  await db.collection('blog_posts').doc(id).update({
    ...data,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
};

export const deleteBlogPost = async (id: string): Promise<void> => {
  await db.collection('blog_posts').doc(id).delete();
};

export const likeBlogPost = async (postId: string, userId: string): Promise<void> => {
  const postRef = db.collection('blog_posts').doc(postId);
  const likeRef = postRef.collection('likes').doc(userId);

  await db.runTransaction(async (transaction) => {
    const likeDoc = await transaction.get(likeRef);
    if (likeDoc.exists) {
      // Unlike
      transaction.delete(likeRef);
      transaction.update(postRef, { likes: firebase.firestore.FieldValue.increment(-1) });
    } else {
      // Like
      transaction.set(likeRef, { createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      transaction.update(postRef, { likes: firebase.firestore.FieldValue.increment(1) });
    }
  });
};


export const hasUserLikedBlogPost = async (postId: string, userId: string): Promise<boolean> => {
  const likeDoc = await db.collection('blog_posts').doc(postId).collection('likes').doc(userId).get();
  return likeDoc.exists;
};

export const getBlogComments = async (postId: string): Promise<Comment[]> => {
  const snapshot = await db.collection('blog_posts').doc(postId).collection('comments')
    .orderBy('isPinned', 'desc')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      user: data.user,
      text: data.text,
      imageUrl: data.imageUrl,
      timestamp: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
      likes: data.likes || [],
      replies: data.replies || [],
      isPinned: data.isPinned || false
    };
  });
};

export const addBlogComment = async (postId: string, user: User, text: string, imageUrl?: string): Promise<Comment> => {
  const postRef = db.collection('blog_posts').doc(postId);
  const commentsRef = postRef.collection('comments');

  const newCommentRef = commentsRef.doc();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();

  const commentData = {
    userId: user.uid,
    user: {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.role === 'admin'
    },
    text,
    imageUrl: imageUrl || null,
    likes: [],
    replies: [],
    isPinned: false,
    createdAt: timestamp
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(newCommentRef, commentData);
    transaction.update(postRef, { commentsCount: firebase.firestore.FieldValue.increment(1) });
  });

  return {
    id: newCommentRef.id,
    user: commentData.user,
    text: commentData.text,
    imageUrl: commentData.imageUrl || undefined,
    timestamp: new Date().toISOString(),
    likes: [],
    replies: [],
    isPinned: false
  };
};

export const toggleCommentLike = async (postId: string, commentId: string, userId: string): Promise<void> => {
  const commentRef = db.collection('blog_posts').doc(postId).collection('comments').doc(commentId);

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(commentRef);
    if (!doc.exists) return;

    const likes = doc.data()?.likes || [];
    if (likes.includes(userId)) {
      transaction.update(commentRef, { likes: firebase.firestore.FieldValue.arrayRemove(userId) });
    } else {
      transaction.update(commentRef, { likes: firebase.firestore.FieldValue.arrayUnion(userId) });
    }
  });
};

export const addCommentReply = async (postId: string, commentId: string, user: User, text: string, imageUrl?: string): Promise<Comment> => {
  const commentRef = db.collection('blog_posts').doc(postId).collection('comments').doc(commentId);
  const reply: Comment = {
    id: Math.random().toString(36).substr(2, 9), // Simple ID for sub-collection emulator or array
    user: {
      uid: user.uid,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.role === 'admin'
    },
    text,
    imageUrl,
    timestamp: new Date().toISOString()
  };

  // Storing replies in an array for simplicity as requested, 
  // though subcollection is better for scalabiltiy. 
  // Given the types interface `replies?: Comment[]`, array is implied.
  await commentRef.update({
    replies: firebase.firestore.FieldValue.arrayUnion(reply)
  });

  return reply;
};

export const pinComment = async (postId: string, commentId: string, isPinned: boolean): Promise<void> => {
  const commentsRef = db.collection('blog_posts').doc(postId).collection('comments');

  // Enforce max 3 pinned logic (if pinning)
  if (isPinned) {
    const pinnedSnapshot = await commentsRef.where('isPinned', '==', true).get();
    if (pinnedSnapshot.size >= 3) {
      throw new Error("Maximum 3 comments can be pinned.");
    }
  }

  await commentsRef.doc(commentId).update({ isPinned });
};

export const deleteBlogComment = async (postId: string, commentId: string): Promise<void> => {
  const postRef = db.collection('blog_posts').doc(postId);
  const commentRef = postRef.collection('comments').doc(commentId);

  await db.runTransaction(async (transaction) => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists) return; // Already deleted

    transaction.delete(commentRef);
    transaction.update(postRef, { commentsCount: firebase.firestore.FieldValue.increment(-1) });
  });
};


// ==========================================
// POST INTERACTION FUNCTIONS
// ==========================================

export const toggleLikePost = async (postId: string, userId: string): Promise<boolean> => {
  const postRef = db.collection('posts').doc(postId);
  const likeRef = postRef.collection('likes').doc(userId);

  let isLiked = false;

  await db.runTransaction(async (transaction) => {
    const likeDoc = await transaction.get(likeRef);

    if (likeDoc.exists) {
      // Unlike
      transaction.delete(likeRef);
      transaction.update(postRef, { likes: firebase.firestore.FieldValue.increment(-1) });
      isLiked = false;
    } else {
      // Like
      transaction.set(likeRef, { createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      transaction.update(postRef, { likes: firebase.firestore.FieldValue.increment(1) });
      isLiked = true;
    }
  });

  return isLiked;
};

export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
  const likeDoc = await db.collection('posts').doc(postId).collection('likes').doc(userId).get();
  return likeDoc.exists;
};

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  createdAt: any; // Timestamp
}

export const addComment = async (postId: string, userId: string, user: { name: string, avatar: string }, text: string): Promise<PostComment> => {
  const postRef = db.collection('posts').doc(postId);
  const commentsRef = postRef.collection('comments');

  const newCommentRef = commentsRef.doc();
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();

  const newComment = {
    id: newCommentRef.id,
    postId,
    userId,
    user,
    text,
    createdAt: timestamp
  };

  await db.runTransaction(async (transaction) => {
    transaction.set(newCommentRef, newComment);
    transaction.update(postRef, { commentsCount: firebase.firestore.FieldValue.increment(1) });
  });

  return newComment as PostComment;
};

export const getComments = async (postId: string): Promise<PostComment[]> => {
  const snapshot = await db.collection('posts').doc(postId).collection('comments')
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PostComment));
};

export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  const postRef = db.collection('posts').doc(postId);
  const commentRef = postRef.collection('comments').doc(commentId);

  await db.runTransaction(async (transaction) => {
    const commentDoc = await transaction.get(commentRef);
    if (!commentDoc.exists) {
      throw new Error("Comment does not exist");
    }

    transaction.delete(commentRef);
    transaction.update(postRef, { commentsCount: firebase.firestore.FieldValue.increment(-1) });
  });
};




// Vault Services
export const createVault = async (userId: string, name: string, description?: string): Promise<Vault> => {
  const vaultsRef = db.collection('users').doc(userId).collection('vaults');
  const newVaultRef = vaultsRef.doc();
  const timestamp = firebase.firestore.Timestamp.now();

  const newVault: Vault = {
    id: newVaultRef.id,
    userId,
    name,
    description: description || null, // Firebase doesn't accept undefined
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await newVaultRef.set(newVault);
  return newVault;
};

export const deleteVault = async (userId: string, vaultId: string): Promise<void> => {
  // 1. Delete all notes in this vault
  const notesRef = db.collection('users').doc(userId).collection('notes');
  const snapshot = await notesRef.where('vaultId', '==', vaultId).get();

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // 2. Delete the vault itself
  const vaultRef = db.collection('users').doc(userId).collection('vaults').doc(vaultId);
  batch.delete(vaultRef);

  await batch.commit();
};

export const updateVault = async (userId: string, vaultId: string, updates: Partial<Vault>): Promise<void> => {
  await db.collection('users').doc(userId).collection('vaults').doc(vaultId).update({
    ...updates,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

export const getUserVaults = async (userId: string): Promise<Vault[]> => {
  const snapshot = await db.collection('users').doc(userId).collection('vaults').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Vault));
};

export const getNotesForVault = async (userId: string, vaultId: string): Promise<Note[]> => {
  const snapshot = await db.collection('users').doc(userId).collection('notes')
    .where('vaultId', '==', vaultId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Note));
};

export const createNoteInVault = async (userId: string, vaultId: string, title: string, content: string, path?: string): Promise<Note> => {
  const notesRef = db.collection('users').doc(userId).collection('notes');
  const newNoteRef = notesRef.doc();
  const timestamp = firebase.firestore.Timestamp.now();

  const newNote: Note = {
    id: newNoteRef.id,
    userId,
    title,
    content,
    vaultId,
    path: path || '',
    isPublic: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await newNoteRef.set(newNote);
  return newNote;
};

export const deleteNote = async (userId: string, noteId: string): Promise<void> => {
  await db.collection('users').doc(userId).collection('notes').doc(noteId).delete();
};

export const updateNote = async (userId: string, noteId: string, updates: Partial<Note>): Promise<void> => {
  await db.collection('users').doc(userId).collection('notes').doc(noteId).update({
    ...updates,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

export const getPublicNote = async (userId: string, noteId: string): Promise<Note | null> => {
  // We need userId to find the note because it's in a subcollection.
  // However, the shared link might only have noteId if we structured it differently.
  // But since notes are subcollections of users, we typically need the userId path.
  // Wait, if I only have noteId, I can't easily find it in a subcollection queryGroup without an index.
  // Simplest approach: The share link should logically be /note/:userId/:noteId OR we use collection group queries.
  // Let's assume for now we will pass userId in the URL or use collection group.

  // Using collection group query for 'notes' where id == noteId AND isPublic == true
  const snapshot = await db.collectionGroup('notes')
    .where('id', '==', noteId)
    .where('isPublic', '==', true)
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  const note = snapshot.docs[0].data() as Note;
  if (!note.isPublic) return null;
  return note;
};
// =========================================================================
// COUPON SERVICE
// =========================================================================

export const createCoupon = async (couponData: Omit<Coupon, 'id' | 'usageCount' | 'isActive'>) => {
  try {
    // Validate discount value server-side
    if (couponData.discountValue <= 0) throw new Error('Discount value must be greater than 0');
    if (couponData.discountType === 'percentage' && couponData.discountValue > 100) throw new Error('Percentage discount cannot exceed 100%');

    // Ensure applicableTo is always set (defaults to 'courses' for backward compat)
    const dataWithDefaults = {
      ...couponData,
      applicableTo: couponData.applicableTo || 'courses',
    };

    // Firebase crashes if any field is entirely `undefined`. We must strip them out:
    const sanitizedData = Object.fromEntries(
      Object.entries(dataWithDefaults).filter(([_, v]) => v !== undefined)
    );

    const docRef = await db.collection('coupons').add({
      ...sanitizedData,
      code: couponData.code.toUpperCase().trim(),
      isActive: true,
      usageCount: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
};


export const getCoupons = async (): Promise<Coupon[]> => {
  try {
    const snapshot = await db.collection('coupons').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Coupon[];
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
};

export const deleteCoupon = async (couponId: string) => {
  try {
    await db.collection('coupons').doc(couponId).delete();
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
};

export const validateCoupon = async (code: string, courseId: string): Promise<Coupon | null> => {
  try {
    const uppercasedCode = code.toUpperCase().trim();
    const snapshot = await db.collection('coupons')
      .where('code', '==', uppercasedCode)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Coupon;

    // Check course restriction
    if (coupon.courseId && coupon.courseId !== courseId) {
      return null;
    }

    // Check expiry
    if (coupon.expiryDate) {
      const expiry = new Date(coupon.expiryDate);
      if (expiry < new Date()) {
        return null;
      }
    }

    // Check usage limits
    if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
      return null;
    }

    return coupon;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return null;
  }
};

export const incrementCouponUsage = async (couponId: string) => {
  try {
    await db.collection('coupons').doc(couponId).update({
      usageCount: firebase.firestore.FieldValue.increment(1)
    });
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
  }
};

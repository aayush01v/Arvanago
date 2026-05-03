
// FIX: Use compat version of Timestamp for type consistency.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export type Timestamp = firebase.firestore.Timestamp;


export interface User {
  uid: string;
  name: string;
  email: string | null;
  avatar: string;
  level: number;
  points: number;
  streak: number;
  completedChallenges: number;
  enrolledCourses: string[];
  ongoingCourses: string[]; // Changed from Course[]
  wishlist: string[]; // Array of course IDs
  pendingTasks: Task[];
  bio?: string;
  coursesAuthored?: number;
  lastLogin?: Timestamp | null;
  themePreference?: 'light' | 'dark';
  role?: 'student' | 'admin' | 'super_admin';
  isDisabled?: boolean;
  disabledUntil?: Timestamp | null;
  isDeleted?: boolean;
  progress?: Record<string, string[]>; // Map courseId -> completedLectureIds
  // New Profile Fields
  username?: string;
  isPublic?: boolean; // Visibility setting
  lastHandleChangeDate?: Timestamp | null; // Track last handle change
  jobTitle?: string;
  coverPhoto?: string;
  socialLinks?: { platform: string; url: string }[];
  website?: string;
  publicEmail?: string;
  followers: number;
  following: number;
  postsCount: number;
  gallery?: string[];
  deletionRequested?: boolean;
  deletionRequestedAt?: Timestamp | null;
}

export interface Comment {
  id: string;
  user: {
    uid?: string; // Add uid for permission checks
    name: string;
    avatar: string;
    isAdmin?: boolean; // For badge
  };
  text: string;
  imageUrl?: string; // For image in comment
  timestamp: string;
  replies?: Comment[];
  likes?: string[]; // Array of userIds who liked
  isPinned?: boolean; // Admin pin
}

export interface DownloadableResource {
  id: string;
  name: string;
  type: 'PDF' | 'ZIP' | 'Blend File';
  size: string;
  url?: string;
}

export interface CourseSocialLink {
  label: string;
  url: string;
}

export interface CourseInstructor {
  id: string;
  name: string;
  title?: string;
  headline?: string;
  avatar?: string;
  rating?: number;
  totalStudents?: number;
  totalReviews?: number;
  bio?: string;
  description?: string;
  socialLinks?: CourseSocialLink[];
}

export interface SuggestedCourseSummary {
  id: string;
  title: string;
  category: string;
  thumbnailUrl?: string;
  price?: number;
  currency?: string;
  isPaid?: boolean;
  tags?: string[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  thumbnailUrl?: string;
  isFree: boolean;
  isPaid: boolean;
  isPublished: boolean;
  isFeaturedOnHome?: boolean;
  featuredPriority?: number;
  lectures: Lecture[];
  sections?: CourseSection[];
  progress: number;
  author: User;
  price?: number;
  currency?: string;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  studentCount?: number;
  lessonsCount?: number;
  totalDuration?: string;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced';
  views?: number;
  subtitle?: string;
  headline?: string;
  lastUpdated?: string;
  updatedAt?: string;
  language?: string;
  previewVideoUrl?: string;
  previewImageUrl?: string;
  learningOutcomes?: string[];
  requirements?: string[];
  longDescription?: string;
  descriptionHtml?: string;
  descriptionSections?: { title: string; content: string }[];
  instructors?: CourseInstructor[];
  includes?: string[];
  faqs?: { question: string; answer: string }[];
  suggestedCourses?: string[];
  suggestedCourseDetails?: SuggestedCourseSummary[];
  // New properties for detailed lecture view
  lectureType?: string;
  critiqueSession?: string;
  tags: string[];
  comments?: Comment[];
  resources?: DownloadableResource[];
  simulations?: Simulation[];
}

export interface Simulation {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  launchUrl: string;
  type: '3D' | 'Lab' | 'Quiz';
}

export interface Lecture {
  id: string;
  title: string;
  duration: string;
  videoUrl: string;
  isCompleted: boolean;
  summary: string;
  isPreview?: boolean;
}


export interface CourseSection {
  title: string;
  lectures: Lecture[];
  progress?: number;
}


export interface LeaderboardEntry {
  rank: number;
  user: {
    uid: string;
    name: string;
    avatar: string;
    title?: string;
  };
  points: number;
}

export interface Task {
  id: string;
  text: string;
  dueDate: string;
  courseId: string;
  courseTitle: string;
  completed?: boolean;
}

export type AppView = 'dashboard' | 'courses' | 'leaderboard' | 'profile' | 'courseDetail' | 'lecture' | 'myLearnings';
export type PageView = 'homepage' | 'login' | 'coursePreview' | AppView;


// ... (existing content)

export interface Post {
  id: string;
  userId: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  imageUrl?: string;
  likes: number;
  commentsCount: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp; // Track edits
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown or HTML
  excerpt: string;
  coverImage?: string;
  author: {
    uid: string;
    name: string;
    avatar: string;
  };
  tags: string[];
  likes: number;
  commentsCount: number;
  isPublished: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  vaultId?: string; // Optional linkage to a vault
  isPublic?: boolean;
  path?: string; // Folder structure path
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Vault {
  id: string;
  userId: string;
  name: string;
  description?: string;
  css?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDefault?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  courseId?: string;       // Optional: if scoped to a specific course
  productId?: string;      // Optional: if scoped to a specific store product
  applicableTo: 'courses' | 'store' | 'all'; // Scope of the coupon
  expiryDate?: string;     // ISO String
  isActive: boolean;
  usageCount: number;
  maxUses?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  stock: number;
  type: 'digital' | 'physical';
  features?: string[];
  specs?: { label: string; value: string }[];
  isPublished: boolean;
  category: string;
  variants?: { label: string; price: number }[];
  ratingAvg?: number;
  reviewCount?: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  createdAt: Timestamp;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1-5
  comment: string;
  timestamp: Timestamp;
  isVerifiedPurchase?: boolean;
  images?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: { label: string; price: number };
}

export interface StoreOrder {
  id: string;
  userId: string;
  items: { productId: string; quantity: number; priceAtPurchase: number; variantLabel?: string }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shippingAddress?: string; // Required if any item is 'physical'
  createdAt: Timestamp;
}

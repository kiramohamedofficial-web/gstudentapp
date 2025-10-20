export enum Role {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export type StudentView = 'home' | 'grades' | 'subscription' | 'profile' | 'ask' | 'results';

export interface User {
  id: string;
  name: string; // Full name
  email?: string;
  phone: string;
  password: string; // Replaces 'code'
  guardianPhone: string;
  grade: number;
  track?: 'Scientific' | 'Literary'; // For 3rd year secondary students
  role: Role;
  subscriptionId?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'Monthly' | 'Quarterly' | 'Annual';
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired';
}

export enum LessonType {
  EXPLANATION = 'Explanation',
  HOMEWORK = 'Homework',
  EXAM = 'Exam',
  SUMMARY = 'Summary',
}

export interface Lesson {
  id:string;
  title: string;
  type: LessonType;
  content: string; // YouTube video ID, summary text, etc.
  
  // Fields for image-based quizzes (Homework/Exam)
  imageUrl?: string; 
  correctAnswers?: string[];

  timeLimit?: number; // in minutes, for exams
  passingScore?: number; // percentage from 0 to 100
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Semester {
  id: string;
  title: string;
  units: Unit[];
}

export interface Grade {
  id: number;
  name: string; // e.g. 'الصف الأول الثانوي'
  ordinal: '1st' | '2nd' | '3rd';
  level: 'Middle' | 'Secondary';
  levelAr: 'الإعدادي' | 'الثانوي';
  semesters: Semester[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface AccessToken {
  token: string;
  gradeId: number;
  semesterId: string;
  unitId: string;
  lessonId: string;
  isUsed: boolean;
  createdAt: string;
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  plan: 'Monthly' | 'Quarterly' | 'Annual';
  paymentFromNumber: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface FeaturedTeacher {
    id: string;
    name: string;
    subject: string;
    imageUrl: string;
}

export interface Course {
  id: string; // could be unit id or a special course id
  title: string;
  subtitle: string;
  coverImage: string;
  fileCount: number;
  videoCount: number;
  quizCount: number;
}

export interface Book {
  id: string;
  title: string;
  teacherName: string;
  teacherImage: string;
  price: number;
  coverImage: string;
}

export interface StudentQuestion {
  id: string;
  userId: string;
  userName: string;
  questionText: string;
  answerText: string | null;
  status: 'Pending' | 'Answered';
  createdAt: string;
  answeredAt: string | null;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  submittedAt: string;
  score: number; // Percentage score
  submittedAnswers?: string[]; // For image-based quizzes
  timeTaken: number; // in seconds
  isPass: boolean;
}

export interface PlatformFeature {
    title: string;
    description: string;
}

export interface PlatformSettings {
  platformName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroImageUrl?: string;
  teacherImageUrl?: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: PlatformFeature[];
  footerDescription: string;
  contactPhone: string;
  contactFacebookUrl: string;
  contactYoutubeUrl: string;
}

// FIX: Export the 'Theme' type to be used for theme switching.
export type Theme = 'dark' | 'light' | 'gold' | 'pink';


declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    // YT is the global object for the YouTube IFrame API
    YT?: {
      Player: new (elementId: string, options: any) => any;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      }
    };
    // Custom property to handle multiple player instances loading the API
    onYouTubeIframeAPIReadyCallbacks?: (() => void)[];
  }
}
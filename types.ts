import React from 'react';

export enum Role {
  STUDENT = 'student',
  ADMIN = 'admin',
  TEACHER = 'teacher',
  SUPERVISOR = 'supervisor',
}

export type StudentView = 'home' | 'grades' | 'subscription' | 'profile' | 'teachers' | 'courses' | 'singleSubjectSubscription' | 'comprehensiveSubscription' | 'results' | 'smartPlan' | 'chatbot' | 'askTheProf' | 'adhkar' | 'cartoonMovies' | 'teacherProfile' | 'courseDetail';
export type TeacherView = 'dashboard' | 'content' | 'subscriptions' | 'profile' | 'questionBank';
export type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'courseManagement' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings' | 'systemHealth' | 'accountSettings' | 'teachers' | 'subscriptionPrices' | 'deviceManagement' | 'content';


export interface User {
  id: string;
  name: string; // Full name
  email: string;
  phone: string;
  guardianPhone: string;
  grade: number | null;
  track?: 'Scientific' | 'Literary' | 'All' | null; // For 2nd & 3rd year secondary students
  role: Role;
  subscriptionId?: string;
  teacherId?: string; // Links user to a teacher profile
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually';
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired';
  teacherId?: string;
}

export enum LessonType {
  EXPLANATION = 'Explanation',
  HOMEWORK = 'Homework',
  EXAM = 'Exam',
  SUMMARY = 'Summary',
}

export enum QuizType {
  IMAGE = 'image',
  MCQ = 'mcq',
}

export interface QuizQuestion {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Lesson {
  id:string;
  title: string;
  type: LessonType;
  content: string; // YouTube video ID, summary text, etc.
  
  // Quiz fields
  quizType?: QuizType;
  // For MCQ
  questions?: QuizQuestion[];
  // For Image-based
  imageUrl?: string; 
  correctAnswers?: string[];

  timeLimit?: number; // in minutes, for exams
  passingScore?: number; // percentage from 0 to 100
  dueDate?: string;
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
  teacherId: string;
  track?: 'Scientific' | 'Literary' | 'Science' | 'Math' | 'All';
  semester_id?: string;
}

export interface Semester {
  id: string;
  title: string;
  units: Unit[];
  grade_id?: number;
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
  plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually';
  paymentFromNumber: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  subjectName?: string;
  unitId?: string;
}

export interface StudentQuestion {
  id: string;
  userId: string;
  userName: string;
  questionText: string;
  answerText?: string;
  status: 'Pending' | 'Answered';
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

export interface Teacher {
    id: string;
    name: string;
    subject: string;
    imageUrl: string;
    teachingLevels?: ('Middle' | 'Secondary')[];
    teachingGrades?: number[];
}

export interface CourseVideo {
  id: string;
  title: string;
  videoUrl: string; // The full YouTube URL
  isFree: boolean;
}

export interface Course {
  id: string; 
  title: string;
  description: string;
  teacherId: string;
  coverImage: string;
  price: number;
  isFree: boolean;
  pdfUrl?: string; // Google Drive link
  videos: CourseVideo[];
}


export interface Book {
  id: string;
  title: string;
  teacherName: string;
  teacherImage: string;
  price: number;
  coverImage: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  lessonId: string;
  submittedAt: string;
  score: number; // Percentage score
  submittedAnswers?: string[] | { [key: number]: number }; // For image-based quizzes or MCQ answers
  timeTaken: number; // in seconds
  isPass: boolean;
}

export interface PlatformFeature {
    title: string;
    description: string;
}

export interface SubscriptionPrices {
  comprehensive: {
    monthly: number;
    quarterly: number;
    annual: number;
  };
  singleSubject: {
    monthly: number;
    semiAnnually: number;
    annually: number;
  };
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
  subscriptionPrices: SubscriptionPrices;
  paymentNumbers: {
    vodafoneCash: string;
  };
}

export type Theme = 'dark' | 'light' | 'royal' | 'gold' | 'pink' | 'sunset' | 'forest' | 'ocean' | 'wave' | 'matrix';

export interface SubscriptionCode {
    code: string;
    teacherId?: string | null;
    durationDays: number;
    maxUses: number;
    timesUsed: number;
    usedByUserIds: string[];
    createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface AppNotification {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'error';
  createdAt: string;
  link?: StudentView;
}


declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    // YT is the global object for the YouTube IFrame API
    YT?: {
      // FIX: Allow YT.Player to accept an HTMLElement as its first argument, not just an ID string.
      Player: new (element: string | HTMLElement, options: any) => any;
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
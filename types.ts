
export enum Role {
  STUDENT = 'student',
  ADMIN = 'admin',
}

export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  GOLD = 'gold',
  PINK = 'pink',
}

export interface User {
  id: string;
  name: string;
  code: string; // Used as password
  grade: number;
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

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content: string; // YouTube video ID, summary text, etc.
  questions?: Question[];
  isCompleted?: boolean; // Student-specific progress
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

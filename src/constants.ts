import { Subject } from './types';

// Demo User Credentials
export const DEMO_STUDENT_IDENTIFIER = 'student@demo.com';
export const DEMO_STUDENT_PASSWORD = '1234';
export const DEMO_ADMIN_IDENTIFIER = 'admin@demo.com';
export const DEMO_ADMIN_PASSWORD = 'admin';

// FIX: Export the 'THEMES' constant for use in theme settings components.
export const THEMES: { id: 'dark' | 'light' | 'gold' | 'pink'; name: string }[] = [
  { id: 'dark', name: 'داكن' },
  { id: 'light', name: 'فاتح' },
  { id: 'gold', name: 'ذهبي' },
  { id: 'pink', name: 'وردي' },
];

export const CURRICULUM_TOPICS: Record<Subject, string[]> = {
  [Subject.ARABIC]: ['النصوص', 'الأدب', 'البلاغة', 'النحو', 'القصة'],
  [Subject.HISTORY]: ['الحملة الفرنسية على مصر', 'بناء الدولة الحديثة في مصر', 'الثورة العرابية', 'مصر منذ الحرب العالمية الأولى حتى ثورة 1952'],
  [Subject.GEOGRAPHY]: ['مدخل لدراسة الجغرافيا السياسية', 'الدولة في الجغرافيا السياسية', 'المقومات الطبيعية لقوة الدولة', 'المشكلات السياسية'],
  [Subject.NATIONAL_EDUCATION]: ['الأخلاق والقانون', 'الدستور', 'الديمقراطية', 'الأحزاب السياسية'],
  [Subject.ENGLISH]: [
    'Unit 1: Reading is food for the mind',
    'Unit 2: The world of work',
    'Unit 3: Beyond imagination',
    'Unit 4: Having a good time',
    'Novel: Great Expectations - Chapters 1-6',
    'Novel: Great Expectations - Chapters 7-12',
  ],
  [Subject.FRENCH]: [
    'Unité 1: Le club des sportifs',
    'Unité 2: Le club des gourmands',
    'Unité 3: Le club des explorateurs',
    'Unité 4: Le club des voyageurs',
    'Grammaire: Le passé composé',
    "Grammaire: L'imparfait et le plus-que-parfait",
  ],
};

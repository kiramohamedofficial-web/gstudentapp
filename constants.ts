
// FIX: Import Subject enum needed for CURRICULUM_TOPICS type definition.
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

// FIX: Add and export CURRICULUM_TOPICS to resolve the import error in QuestionGeneratorView.tsx.
export const CURRICULUM_TOPICS: Record<Subject, string[]> = {
  [Subject.ARABIC]: ['النصوص والبلاغة', 'النحو والصرف', 'الأدب العربي الحديث', 'القراءة والنصوص المتحررة'],
  [Subject.HISTORY]: ['الحملة الفرنسية على مصر', 'محمد علي وبناء الدولة الحديثة', 'تاريخ مصر المعاصر', 'الثورات المصرية'],
  [Subject.GEOGRAPHY]: ['الجغرافيا الطبيعية لمصر', 'الجغرافيا البشرية لمصر', 'الجغرافيا الاقتصادية', 'الخرائط والمقاييس'],
  [Subject.NATIONAL_EDUCATION]: ['الدستور والقانون', 'حقوق الإنسان', 'المشاركة المجتمعية', 'الهوية المصرية'],
  [Subject.ENGLISH]: ['Grammar: Tenses', 'Vocabulary: Unit 1-3', 'Reading Comprehension', 'Essay Writing'],
  [Subject.FRENCH]: ['Grammaire: Le passé composé', 'Vocabulaire: La vie quotidienne', 'Compréhension écrite', 'Production écrite'],
};

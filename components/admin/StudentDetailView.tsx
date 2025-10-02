
import React, { useMemo } from 'react';
import { User, Grade, Subscription, Lesson, LessonType } from '../../types';
import { getGradeById, getSubscriptionByUserId } from '../../services/storageService';
import { ArrowRightIcon, CheckCircleIcon, ClockIcon } from '../common/Icons';

interface GroupedLesson {
    baseTitle: string;
    parts: Partial<Record<LessonType, Lesson>>;
}

interface StudentDetailViewProps {
  user: User;
  onBack: () => void;
}

const StudentDetailView: React.FC<StudentDetailViewProps> = ({ user, onBack }) => {
  const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);

  const { totalLessons, completedLessons, progress } = useMemo(() => {
    if (!grade) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    const total = allLessons.length;
    const completed = allLessons.filter(l => l.isCompleted).length;
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { totalLessons: total, completedLessons: completed, progress: prog };
  }, [grade]);

  if (!grade) {
    return <div>Could not load student data.</div>;
  }
  
  const groupLessons = (lessons: Lesson[]): GroupedLesson[] => {
    const lessonGroups: Record<string, Partial<Record<LessonType, Lesson>>> = {};

    lessons.forEach(lesson => {
        const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
        if (!lessonGroups[baseTitle]) {
            lessonGroups[baseTitle] = {};
        }
        lessonGroups[baseTitle][lesson.type] = lesson;
    });

    return Object.entries(lessonGroups).map(([baseTitle, parts]) => ({
        baseTitle,
        parts,
    }));
  };

  return (
    <div className="fade-in">
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى قائمة الطلاب</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile & Progress */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl mb-4">
                {user.name.charAt(0)}
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h1>
              <p className="text-[var(--text-secondary)]">{grade.name}</p>
              <span className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full ${subscription?.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {subscription?.status === 'Active' ? `اشتراك نشط` : 'اشتراك غير نشط'}
              </span>
            </div>
          </div>

          <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">تقدم الطالب الإجمالي</h2>
            <div>
                <div className="flex justify-between items-center mb-2 text-sm text-[var(--text-secondary)]">
                    <span>التقدم</span>
                    <span className="font-bold text-[var(--text-primary)]">{progress}%</span>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-3">
                    <div 
                        className="bg-[var(--accent-gradient)] h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-center mt-3 text-sm text-[var(--text-secondary)]">
                    أكمل الطالب <span className="font-bold text-[var(--text-primary)]">{completedLessons}</span> من أصل <span className="font-bold text-[var(--text-primary)]">{totalLessons}</span> جزء.
                </p>
            </div>
          </div>
        </div>

        {/* Right Column - Course Breakdown */}
        <div className="lg:col-span-2 bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">تفاصيل المنهج الدراسي</h2>
            <div className="space-y-6">
                {grade.semesters.map(semester => (
                    <div key={semester.id}>
                        <h3 className="text-md font-semibold text-[var(--text-secondary)] border-r-2 border-[var(--accent-primary)] pr-3 mb-3">{semester.title}</h3>
                        <div className="space-y-3">
                            {semester.units.map(unit => {
                                const groupedLessons = groupLessons(unit.lessons);
                                return (
                                <div key={unit.id} className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                                    <p className="font-bold text-md text-[var(--text-primary)] mb-2">{unit.title}</p>
                                    <div className="space-y-3 pr-2 border-r border-[var(--border-primary)]">
                                        {groupedLessons.map((group) => (
                                            <div key={group.baseTitle}>
                                                <p className="font-semibold text-sm text-[var(--text-secondary)] mb-1">{group.baseTitle}</p>
                                                <ul className="space-y-1 pr-2">
                                                    {Object.values(group.parts).map((lesson) => lesson && (
                                                        <li key={lesson.id} className="flex items-center justify-between text-sm">
                                                            <span className="text-[var(--text-secondary)]">{lesson.type}</span>
                                                            {lesson.isCompleted ? (
                                                                <div className="flex items-center space-x-1 space-x-reverse text-green-400">
                                                                    <CheckCircleIcon className="w-4 h-4" />
                                                                    <span>مكتمل</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center space-x-1 space-x-reverse text-yellow-500">
                                                                    <ClockIcon className="w-4 h-4" />
                                                                    <span>قيد الانتظار</span>
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                        {groupedLessons.length === 0 && <p className="text-xs text-center text-[var(--text-secondary)] py-2">لا توجد دروس لهذه المادة بعد.</p>}
                                    </div>
                                </div>
                                )}
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailView;

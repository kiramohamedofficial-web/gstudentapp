

import React, { useState, useMemo, useEffect } from 'react';
import { Grade, Unit, Lesson, LessonType, ToastType, User } from '../../types';
import { getUserProgress, setLessonCompleted } from '../../services/storageService';
import { useToast } from '../../useToast';
import LessonView from './LessonView';
import { BookOpenIcon, PencilIcon, CheckCircleIcon, VideoCameraIcon, DocumentTextIcon, ArrowRightIcon } from '../common/Icons';

interface GroupedLesson {
    baseTitle: string;
    explanation?: Lesson;
    homework?: Lesson;
    exam?: Lesson;
    summary?: Lesson;
    isCompleted: boolean;
    progress: number;
    completedCount: number;
    totalParts: number;
}

interface CourseViewProps {
  grade: Grade;
  unit: Unit;
  user: User;
  onBack: () => void;
}

const LessonPartCard: React.FC<{ lesson: Lesson; onSelect: (lesson: Lesson) => void; isCompleted: boolean; }> = ({ lesson, onSelect, isCompleted }) => {
    const typeInfo: Record<LessonType, { icon: React.FC<{className?: string}>; label: string }> = {
        [LessonType.EXPLANATION]: { icon: VideoCameraIcon, label: 'شرح الدرس' },
        [LessonType.HOMEWORK]: { icon: PencilIcon, label: 'الواجب' },
        [LessonType.EXAM]: { icon: BookOpenIcon, label: 'الامتحان' },
        [LessonType.SUMMARY]: { icon: DocumentTextIcon, label: 'الملخص' },
    };
    
    const { icon: Icon, label } = typeInfo[lesson.type];

    return (
        <button 
            onClick={() => onSelect(lesson)}
            className="bg-[var(--bg-tertiary)] p-4 rounded-lg text-right w-full flex items-center space-x-3 space-x-reverse transition-all duration-300 transform hover:scale-105 hover:bg-[var(--border-primary)] group"
        >
            <div className={`p-2 rounded-md ${isCompleted ? 'text-green-500 bg-green-500/10' : 'text-[var(--accent-primary)] bg-blue-500/10'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm text-[var(--text-primary)]">{label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{isCompleted ? 'مكتمل' : 'ابدأ الآن'}</p>
            </div>
            {isCompleted && (
                <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            )}
        </button>
    );
};


const GroupedLessonCard: React.FC<{ groupedLesson: GroupedLesson; onSelect: (lesson: Lesson) => void; index: number; userProgress: Record<string, boolean>; }> = ({ groupedLesson, onSelect, index, userProgress }) => {
    return (
        <div
            className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] p-5 flex flex-col transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:border-[var(--accent-primary)] group fade-in"
            style={{ animationDelay: `${index * 75}ms`}}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center">
                        <span className="ml-3 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] text-[var(--accent-primary)] font-mono text-sm">
                           {String(index + 1).padStart(2, '0')}
                        </span>
                        {groupedLesson.baseTitle}
                    </h3>
                </div>
                {groupedLesson.isCompleted && (
                    <div className="flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs font-semibold text-green-500 bg-green-500/10 rounded-full">
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>مكتمل</span>
                    </div>
                )}
            </div>
            
            {/* Progress */}
            <div className="mb-5">
                <div className="flex justify-between items-center mb-1 text-xs text-[var(--text-secondary)]">
                    <span className="font-semibold">التقدم</span>
                    <span>{groupedLesson.completedCount} / {groupedLesson.totalParts} مكتمل</span>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
                    <div className="bg-[var(--accent-primary)] h-full rounded-full transition-all duration-500" style={{width: `${groupedLesson.progress}%`}}></div>
                </div>
            </div>

            {/* Lesson Parts */}
            <div className="space-y-3">
                {groupedLesson.explanation && <LessonPartCard lesson={groupedLesson.explanation} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.explanation.id]} />}
                {groupedLesson.homework && <LessonPartCard lesson={groupedLesson.homework} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.homework.id]} />}
                {groupedLesson.exam && <LessonPartCard lesson={groupedLesson.exam} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.exam.id]} />}
                {groupedLesson.summary && <LessonPartCard lesson={groupedLesson.summary} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.summary.id]} />}
            </div>
        </div>
    );
};

const CourseView: React.FC<CourseViewProps> = ({ grade, unit, user, onBack }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const { addToast } = useToast();

  useEffect(() => {
      setUserProgress(getUserProgress(user.id));
  }, [user.id]);

  const groupedLessons = useMemo((): GroupedLesson[] => {
    const lessonGroups: Record<string, Partial<Record<LessonType, Lesson>>> = {};

    unit.lessons.forEach(lesson => {
        const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
        
        if (!lessonGroups[baseTitle]) {
            lessonGroups[baseTitle] = {};
        }
        lessonGroups[baseTitle][lesson.type] = lesson;
    });

    return Object.entries(lessonGroups).map(([baseTitle, parts]) => {
        const lessonParts = Object.values(parts).filter(p => p) as Lesson[];
        const completedCount = lessonParts.filter(p => !!userProgress[p.id]).length;
        const totalParts = lessonParts.length;
        
        return {
            baseTitle,
            explanation: parts[LessonType.EXPLANATION],
            homework: parts[LessonType.HOMEWORK],
            exam: parts[LessonType.EXAM],
            summary: parts[LessonType.SUMMARY],
            isCompleted: totalParts > 0 && completedCount === totalParts,
            progress: totalParts > 0 ? (completedCount / totalParts) * 100 : 0,
            completedCount,
            totalParts,
        };
    });
  }, [unit.lessons, userProgress]);


  const handleLessonComplete = (lessonId: string) => {
    if (!userProgress[lessonId]) {
      setLessonCompleted(user.id, lessonId, true);
      setUserProgress(prev => ({ ...prev, [lessonId]: true }));
      addToast('أحسنت! لقد أكملت هذا الجزء بنجاح.', ToastType.SUCCESS);
    }
  };

  if (activeLesson) {
    return <LessonView 
        lesson={activeLesson} 
        onBack={() => setActiveLesson(null)} 
        grade={grade}
        user={user}
        onLessonComplete={handleLessonComplete}
    />;
  }
  
  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى اختيار المواد</span>
      </button>

      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-[var(--text-primary)]">محتوى مادة: {unit.title}</h1>
      <p className="text-md text-[var(--text-secondary)] mb-8">استعرض جميع الدروس والواجبات المتاحة لهذه المادة.</p>
      
      {groupedLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedLessons.map((groupedLesson, index) => (
            <GroupedLessonCard
              key={groupedLesson.baseTitle} 
              groupedLesson={groupedLesson}
              onSelect={setActiveLesson}
              index={index}
              userProgress={userProgress}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
            <p className="text-[var(--text-secondary)]">لم يتم إضافة دروس لهذه المادة بعد.</p>
        </div>
      )}
    </div>
  );
};

export default CourseView;
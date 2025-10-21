
import React, { useState, useMemo } from 'react';
import { Grade, Unit, Lesson, LessonType, ToastType } from '../../types';
import { setLessonCompleted } from '../../services/storageService';
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
  onBack: () => void;
}

const LessonPartCard: React.FC<{ lesson: Lesson; onSelect: (lesson: Lesson) => void; }> = ({ lesson, onSelect }) => {
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
            className="bg-[var(--bg-secondary)] p-4 rounded-lg text-right w-full flex items-center space-x-3 space-x-reverse transition-all duration-300 transform hover:scale-105 hover:bg-[var(--bg-tertiary)] group"
        >
            <div className={`p-2 rounded-md bg-gradient-to-br from-white/5 to-white/10 ${lesson.isCompleted ? 'text-green-400' : 'text-[var(--accent-primary)]'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-sm text-[var(--text-primary)]">{label}</p>
                <p className="text-xs text-[var(--text-secondary)]">{lesson.isCompleted ? 'مكتمل' : 'ابدأ الآن'}</p>
            </div>
            {lesson.isCompleted && (
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
            )}
        </button>
    );
};


const GroupedLessonCard: React.FC<{ groupedLesson: GroupedLesson; onSelect: (lesson: Lesson) => void; index: number }> = ({ groupedLesson, onSelect, index }) => {
    return (
        <div
            className="bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)] p-5 flex flex-col transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:border-[var(--accent-primary)] group fade-in"
            style={{ animationDelay: `${index * 75}ms`}}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center">
                        <span className="ml-3 flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-secondary)] text-[var(--accent-primary)] font-mono text-sm">
                           {String(index + 1).padStart(2, '0')}
                        </span>
                        {groupedLesson.baseTitle}
                    </h3>
                </div>
                {groupedLesson.isCompleted && (
                    <div className="flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs font-semibold text-green-400 bg-green-500/10 rounded-full">
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
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500" style={{width: `${groupedLesson.progress}%`}}></div>
                </div>
            </div>

            {/* Lesson Parts */}
            <div className="space-y-3">
                {groupedLesson.explanation && <LessonPartCard lesson={groupedLesson.explanation} onSelect={onSelect} />}
                {groupedLesson.homework && <LessonPartCard lesson={groupedLesson.homework} onSelect={onSelect} />}
                {groupedLesson.exam && <LessonPartCard lesson={groupedLesson.exam} onSelect={onSelect} />}
                {groupedLesson.summary && <LessonPartCard lesson={groupedLesson.summary} onSelect={onSelect} />}
            </div>
        </div>
    );
};

const CourseView: React.FC<CourseViewProps> = ({ grade, unit, onBack }) => {
  const [currentUnit, setCurrentUnit] = useState<Unit>(unit);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const { addToast } = useToast();

  const groupedLessons = useMemo((): GroupedLesson[] => {
    const lessonGroups: Record<string, Partial<Record<LessonType, Lesson>>> = {};

    currentUnit.lessons.forEach(lesson => {
        const baseTitle = lesson.title.replace(/^(شرح|واجب|امتحان|ملخص)\s/, '').trim();
        
        if (!lessonGroups[baseTitle]) {
            lessonGroups[baseTitle] = {};
        }
        lessonGroups[baseTitle][lesson.type] = lesson;
    });

    return Object.entries(lessonGroups).map(([baseTitle, parts]) => {
        const lessonParts = Object.values(parts).filter(p => p) as Lesson[];
        const completedCount = lessonParts.filter(p => p.isCompleted).length;
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
  }, [currentUnit.lessons]);


  const handleLessonComplete = (lessonId: string) => {
    const lessonExists = currentUnit.lessons.some(l => l.id === lessonId && !l.isCompleted);
      
    if (lessonExists) {
      setLessonCompleted(grade.id, lessonId, true);
      
      setCurrentUnit(prevUnit => {
        const newLessons = prevUnit.lessons.map(l => 
          l.id === lessonId ? { ...l, isCompleted: true } : l
        );
        return { ...prevUnit, lessons: newLessons };
      });
      addToast('أحسنت! لقد أكملت هذا الجزء بنجاح.', ToastType.SUCCESS);
    }
  };

  if (activeLesson) {
    return <LessonView 
        lesson={activeLesson} 
        onBack={() => setActiveLesson(null)} 
        grade={grade}
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
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-primary)]">
            <p className="text-[var(--text-secondary)]">لم يتم إضافة دروس لهذه المادة بعد.</p>
        </div>
      )}
    </div>
  );
};

export default CourseView;

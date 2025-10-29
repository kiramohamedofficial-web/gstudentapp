import React, { useState, useMemo, useEffect } from 'react';
import { Grade, Unit, Lesson, LessonType, ToastType, User, StudentView } from '../../types';
import { getStudentProgress, markLessonComplete } from '../../services/storageService';
import { useToast } from '../../useToast';
import LessonView from './LessonView';
import { BookOpenIcon, PencilIcon, CheckCircleIcon, VideoCameraIcon, DocumentTextIcon, ArrowRightIcon, ChevronDownIcon, PlaySolidIcon } from '../common/Icons';

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
  onNavigate: (view: StudentView) => void;
  initialLesson?: Lesson | null;
  isDataSaverEnabled: boolean;
}

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
    const strokeWidth = 5;
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-12 h-12 flex-shrink-0">
            <svg className="w-full h-full" viewBox="0 0 50 50">
                <circle
                    className="text-[var(--border-primary)]"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="25"
                    cy="25"
                />
                <circle
                    className="text-[var(--accent-primary)] transition-all duration-500"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset }}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="25"
                    cy="25"
                    transform="rotate(-90 25 25)"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                {Math.round(progress)}%
            </span>
        </div>
    );
};


const LessonPartCard: React.FC<{ lesson: Lesson; onSelect: (lesson: Lesson) => void; isCompleted: boolean; }> = ({ lesson, onSelect, isCompleted }) => {
    const typeInfo: Record<LessonType, { icon: React.FC<{className?: string}>; label: string; action: string }> = {
        [LessonType.EXPLANATION]: { icon: VideoCameraIcon, label: 'شرح الدرس', action: 'مشاهدة' },
        [LessonType.HOMEWORK]: { icon: PencilIcon, label: 'الواجب', action: 'بدء' },
        [LessonType.EXAM]: { icon: BookOpenIcon, label: 'الامتحان', action: 'بدء' },
        [LessonType.SUMMARY]: { icon: DocumentTextIcon, label: 'الملخص', action: 'قراءة' },
    };
    
    const { icon: Icon, label, action } = typeInfo[lesson.type];

    return (
        <button 
            onClick={() => onSelect(lesson)}
            className="bg-[var(--bg-primary)] p-3 rounded-lg text-right w-full flex items-center space-x-4 space-x-reverse transition-all duration-300 transform hover:bg-[var(--border-primary)] group"
        >
            <div className={`p-3 rounded-md transition-colors ${isCompleted ? 'text-green-400 bg-green-500/10' : 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)]'}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-grow">
                <p className="font-semibold text-md text-[var(--text-primary)]">{label}</p>
                <p className="text-sm text-[var(--text-secondary)]">{lesson.title}</p>
            </div>
            {isCompleted ? (
                <div className="flex items-center space-x-1 space-x-reverse text-green-400 font-semibold">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>مكتمل</span>
                </div>
            ) : (
                 <div className="flex items-center space-x-2 space-x-reverse py-2 px-4 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-accent)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                    <span>{action}</span>
                    <PlaySolidIcon className="w-5 h-5"/>
                </div>
            )}
        </button>
    );
};

const LessonAccordionItem: React.FC<{ 
    groupedLesson: GroupedLesson; 
    onSelect: (lesson: Lesson) => void; 
    index: number; 
    userProgress: Record<string, boolean>;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ groupedLesson, onSelect, index, userProgress, isOpen, onToggle }) => {
     return (
        <div
            className={`bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] transition-all duration-300 ease-in-out fade-in ${isOpen ? 'border-[var(--accent-primary)] shadow-lg' : 'hover:border-[var(--border-secondary)]'}`}
            style={{ animationDelay: `${index * 75}ms`}}
        >
            {/* Header */}
            <button onClick={onToggle} className="w-full flex justify-between items-center p-4 text-right">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <span className="text-xl font-mono text-[var(--text-secondary)]">
                       {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">{groupedLesson.baseTitle}</h3>
                    {groupedLesson.isCompleted && (
                        <div className="hidden sm:flex items-center space-x-1 space-x-reverse px-2 py-1 text-xs font-semibold text-green-400 bg-green-500/10 rounded-full">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>مكتمل</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center space-x-4 space-x-reverse">
                    <CircularProgress progress={groupedLesson.progress} />
                    <ChevronDownIcon className={`w-6 h-6 text-[var(--text-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>
            
            {/* Content Body */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="p-4 border-t border-[var(--border-primary)] space-y-3">
                    {groupedLesson.explanation && <LessonPartCard lesson={groupedLesson.explanation} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.explanation.id]} />}
                    {groupedLesson.homework && <LessonPartCard lesson={groupedLesson.homework} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.homework.id]} />}
                    {groupedLesson.exam && <LessonPartCard lesson={groupedLesson.exam} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.exam.id]} />}
                    {groupedLesson.summary && <LessonPartCard lesson={groupedLesson.summary} onSelect={onSelect} isCompleted={!!userProgress[groupedLesson.summary.id]} />}
                </div>
            </div>
        </div>
    );
};


const CourseView: React.FC<CourseViewProps> = ({ grade, unit, user, onBack, onNavigate, initialLesson, isDataSaverEnabled }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const { addToast } = useToast();

    useEffect(() => {
        const fetchProgress = async () => {
            const progressData = await getStudentProgress(user.id);
            if (progressData) {
                const progressMap = progressData.reduce((acc, item) => {
                    acc[item.lesson_id] = true;
                    return acc;
                }, {} as Record<string, boolean>);
                setUserProgress(progressMap);
            }
        };
        fetchProgress();
    }, [user.id]);

  useEffect(() => {
    if (initialLesson) {
        setActiveLesson(initialLesson);
    }
  }, [initialLesson]);

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
  
  const unitProgress = useMemo(() => {
    if (!unit.lessons || unit.lessons.length === 0) return 0;
    const completedCount = unit.lessons.filter(lesson => userProgress[lesson.id]).length;
    return Math.round((completedCount / unit.lessons.length) * 100);
  }, [unit, userProgress]);


  const handleLessonComplete = async (lessonId: string) => {
    if (!userProgress[lessonId]) {
      await markLessonComplete(user.id, lessonId);
      setUserProgress(prev => ({ ...prev, [lessonId]: true }));
      addToast('أحسنت! لقد أكملت هذا الجزء بنجاح.', ToastType.SUCCESS);
    }
  };

  const handleToggleAccordion = (baseTitle: string) => {
    setOpenAccordion(prev => (prev === baseTitle ? null : baseTitle));
  };


  if (activeLesson) {
    return <LessonView 
        lesson={activeLesson} 
        onBack={() => setActiveLesson(null)} 
        grade={grade}
        onLessonComplete={handleLessonComplete}
        onNavigate={onNavigate}
        isDataSaverEnabled={isDataSaverEnabled}
    />;
  }
  
  return (
    <div>
      <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
        <ArrowRightIcon className="w-4 h-4" />
        <span>العودة إلى اختيار المواد</span>
      </button>

       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div className="w-full md:w-auto md:order-1 order-2">
              <div className="bg-[rgba(var(--bg-secondary-rgb),0.5)] border border-[var(--border-primary)] rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm w-full md:w-48">
                  <p className="text-md text-[var(--text-secondary)] mb-2">معدل إنجاز الوحدة</p>
                  <p className="text-5xl font-black text-gradient-purple-blue">{unitProgress}%</p>
              </div>
          </div>
          <div className="flex-1 text-right md:order-2 order-1">
              <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] leading-tight">
                  الدروس <span className="text-gradient-purple">والمحتوى</span> <span className="text-gradient-blue">التعليمي</span>
              </h1>
              <p className="text-md text-[var(--text-secondary)] mt-2">
                  {grade.name} - {unit.title}
              </p>
          </div>
      </div>
      
      {groupedLessons.length > 0 ? (
        <div className="space-y-4">
          {groupedLessons.map((groupedLesson, index) => (
            <LessonAccordionItem
              key={groupedLesson.baseTitle} 
              groupedLesson={groupedLesson}
              onSelect={setActiveLesson}
              index={index}
              userProgress={userProgress}
              isOpen={openAccordion === groupedLesson.baseTitle}
              onToggle={() => handleToggleAccordion(groupedLesson.baseTitle)}
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
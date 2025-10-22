import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Grade, Unit, Lesson, LessonType, ToastType, User, Teacher, Book } from '../../types';
import { getUserProgress, setLessonCompleted, getTeachers, hasSubscriptionForItem, getFeaturedBooks } from '../../services/storageService';
import { useToast } from '../../useToast';
import LessonView from './LessonView';
import { BookOpenIcon, PencilIcon, CheckCircleIcon, VideoCameraIcon, DocumentTextIcon, ArrowRightIcon, ChevronDownIcon, PlaySolidIcon, ShieldCheckIcon, ChevronLeftIcon, ChevronRightIcon } from '../common/Icons';
import Modal from '../common/Modal';

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
  onSubscriptionNeeded: (unit: Unit) => void;
}

// Carousel component for horizontal scrolling content
const Carousel: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -300 : 300;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section>
            <header className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
                <div className="flex items-center space-x-2 space-x-reverse">
                    <button onClick={() => scroll('left')} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => scroll('right')} className="p-2 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <div
                ref={scrollRef}
                className="flex overflow-x-auto gap-5 p-2 scroll-smooth"
                style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
            >
                {children}
            </div>
        </section>
    );
};

// Book Card component
const BookCard: React.FC<{ book: Book }> = ({ book }) => (
    <div className="flex-shrink-0 w-52 p-4 bg-[var(--bg-tertiary)] rounded-2xl shadow-md border border-[var(--border-primary)] group transition-transform duration-300 hover:-translate-y-1">
        <div className="relative">
             <img src={book.coverImage} alt={book.title} className="w-full h-60 object-contain rounded-md mb-3 transition-transform duration-500 group-hover:scale-105" style={{filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))'}} loading="lazy" decoding="async"/>
        </div>
        <h3 className="font-bold text-md text-[var(--text-primary)] truncate mt-2">{book.title}</h3>
        <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--text-secondary)]">{book.teacherName}</span>
            <span className="font-bold text-md text-[var(--text-accent)]">{book.price} ج.م</span>
        </div>
    </div>
);


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


const CourseView: React.FC<CourseViewProps> = ({ grade, unit, user, onBack, onSubscriptionNeeded }) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [showSubPrompt, setShowSubPrompt] = useState(false);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
      setUserProgress(getUserProgress(user.id));
      if (unit.teacherId) {
          const allTeachers = getTeachers();
          const unitTeacher = allTeachers.find(t => t.id === unit.teacherId);
          setTeacher(unitTeacher || null);
      }

       // Fetch and filter related books
        const allBooks = getFeaturedBooks();
        const subjectKeyword = unit.title.split(' ')[0]; // e.g., "الجبر" from "الجبر وحساب المثلثات"
        if (subjectKeyword) {
            const related = allBooks.filter(book => book.title.includes(subjectKeyword));
            setRelatedBooks(related);
        }
  }, [user.id, unit.teacherId, unit.title]);

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

  const handleToggleAccordion = (baseTitle: string) => {
    setOpenAccordion(prev => (prev === baseTitle ? null : baseTitle));
  };

  const handleLessonClick = (lesson: Lesson) => {
    const isSubscribed = hasSubscriptionForItem(user.id, unit.id);
    if (isSubscribed) {
        setActiveLesson(lesson);
    } else {
        setShowSubPrompt(true);
    }
  };

  const handleConfirmSubscription = () => {
    setShowSubPrompt(false);
    onSubscriptionNeeded(unit);
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
      <p className="text-md text-[var(--text-secondary)] mb-8">
        {teacher ? `مقدمة من ${teacher.name}` : 'اختر درساً لبدء رحلتك التعليمية.'}
      </p>
      
      {groupedLessons.length > 0 ? (
        <div className="space-y-4">
          {groupedLessons.map((groupedLesson, index) => (
            <LessonAccordionItem
              key={groupedLesson.baseTitle} 
              groupedLesson={groupedLesson}
              onSelect={handleLessonClick}
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

      <div className="mt-12">
        {relatedBooks.length > 0 && (
            <Carousel title="كتب وملازم متعلقة">
                {relatedBooks.map(book => <BookCard key={book.id} book={book} />)}
            </Carousel>
        )}
      </div>

       <Modal isOpen={showSubPrompt} onClose={() => setShowSubPrompt(false)} title="الاشتراك مطلوب">
            <div className="text-center">
                <ShieldCheckIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <p className="text-lg text-[var(--text-secondary)]">
                    يجب عليك الاشتراك في مادة <strong className="text-[var(--text-primary)]">"{unit.title}"</strong> أولاً لتتمكن من عرض هذا المحتوى.
                </p>
                <div className="flex justify-center mt-6 space-x-4 space-x-reverse">
                    <button 
                        onClick={() => setShowSubPrompt(false)} 
                        className="px-6 py-2.5 font-semibold bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-lg transition-colors"
                    >
                        إلغاء
                    </button>
                    <button 
                        onClick={handleConfirmSubscription}
                        className="px-6 py-2.5 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md"
                    >
                        الانتقال للاشتراك
                    </button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default CourseView;
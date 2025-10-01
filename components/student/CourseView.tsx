
import React, { useState, useEffect } from 'react';
import { Grade, Semester, Unit, Lesson, LessonType, ToastType } from '../../types';
import { setLessonCompleted } from '../../services/storageService';
import { useToast } from '../../useToast';
import LessonView from './LessonView';
import { BookOpenIcon, PencilIcon, CheckCircleIcon, VideoCameraIcon, DocumentTextIcon, AtomIcon } from '../common/Icons';

interface CourseViewProps {
  grade: Grade;
}

const LessonTypeIcon: React.FC<{ type: LessonType }> = ({ type }) => {
    const commonClass = "w-6 h-6 ml-4 text-[var(--accent-primary)]";
    switch (type) {
        case LessonType.EXPLANATION:
            return <VideoCameraIcon className={commonClass} />;
        case LessonType.HOMEWORK:
            return <PencilIcon className={commonClass} />;
        case LessonType.EXAM:
            return <BookOpenIcon className={commonClass} />;
        case LessonType.SUMMARY:
            return <DocumentTextIcon className={commonClass} />;
        default:
            return null;
    }
};

const UnitProgressBar: React.FC<{ unit: Unit }> = ({ unit }) => {
    const totalLessons = unit.lessons.length;
    const completedLessons = unit.lessons.filter(l => l.isCompleted).length;
    const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">التقدم</span>
                <span className="text-xs font-medium text-[var(--text-secondary)]">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5">
                <div className="bg-[var(--accent-primary)] h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
}

const CourseView: React.FC<CourseViewProps> = ({ grade }) => {
  const [currentGrade, setCurrentGrade] = useState<Grade>(grade);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [openUnit, setOpenUnit] = useState<string | null>(grade.semesters[0]?.units[0]?.id || null);
  const { addToast } = useToast();

  useEffect(() => {
    setCurrentGrade(grade);
  }, [grade]);

  const handleLessonComplete = (lessonId: string) => {
    const lesson = currentGrade.semesters
      .flatMap(s => s.units)
      .flatMap(u => u.lessons)
      .find(l => l.id === lessonId);
      
    if (lesson && !lesson.isCompleted) {
      setLessonCompleted(currentGrade.id, lessonId, true);
      
      const newGradeData = JSON.parse(JSON.stringify(currentGrade));
      const lessonToUpdate = newGradeData.semesters
        .flatMap((s: Semester) => s.units)
        .flatMap((u: Unit) => u.lessons)
        .find((l: Lesson) => l.id === lessonId);

      if (lessonToUpdate) {
        lessonToUpdate.isCompleted = true;
        setCurrentGrade(newGradeData);
      }
      addToast('أحسنت! لقد أكملت الدرس بنجاح.', ToastType.SUCCESS);
    }
  };

  if (activeLesson) {
    const lessonFromState = currentGrade.semesters
        .flatMap(s => s.units)
        .flatMap(u => u.lessons)
        .find(l => l.id === activeLesson.id);

    return <LessonView 
        lesson={lessonFromState || activeLesson} 
        onBack={() => setActiveLesson(null)} 
        grade={currentGrade}
        onLessonComplete={handleLessonComplete}
    />;
  }
  
  const toggleUnit = (unitId: string) => {
    setOpenUnit(openUnit === unitId ? null : unitId);
  };

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[var(--text-primary)]">المنهج الدراسي لـ{currentGrade.name}</h1>
      {currentGrade.semesters.map((semester: Semester) => (
        <div key={semester.id} className="mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-5 text-[var(--text-secondary)] border-r-4 border-[var(--accent-primary)] pr-4">{semester.title}</h2>
          <div className="space-y-4">
            {semester.units.map((unit: Unit, index: number) => (
              <div key={unit.id} className={`bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)] overflow-hidden transition-all duration-500 fade-in`} style={{animationDelay: `${index * 100}ms`}}>
                <button 
                  onClick={() => toggleUnit(unit.id)}
                  className="w-full text-right p-5 flex justify-between items-center bg-gradient-to-r from-transparent to-[var(--bg-secondary)]/30 hover:to-[var(--bg-secondary)]/60 transition-colors"
                >
                  <AtomIcon className="w-10 h-10 text-[var(--accent-secondary)] opacity-70 flex-shrink-0" />
                  <div className="flex-grow pr-4">
                      <span className="text-lg md:text-xl font-bold text-[var(--text-primary)]">{unit.title}</span>
                      <div className="mt-2">
                        <UnitProgressBar unit={unit} />
                      </div>
                  </div>
                  <svg className={`w-6 h-6 transform transition-transform duration-300 text-[var(--text-secondary)] flex-shrink-0 ${openUnit === unit.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`transition-all duration-500 ease-in-out ${openUnit === unit.id ? 'max-h-screen' : 'max-h-0'}`}>
                    <div className="p-2 border-t border-[var(--border-primary)]">
                    {unit.lessons.map((lesson: Lesson) => (
                        <div
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className="flex items-center justify-between p-4 m-2 rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)] transition-all duration-200 group"
                        >
                        <div className="flex items-center text-[var(--text-primary)]">
                            <LessonTypeIcon type={lesson.type} />
                            <div>
                                <p className="font-semibold">{lesson.title}</p>
                                <p className="text-sm text-[var(--text-secondary)]">{lesson.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            {lesson.isCompleted && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                            <span className="text-sm text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity">ابدأ الدرس &rarr;</span>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CourseView;

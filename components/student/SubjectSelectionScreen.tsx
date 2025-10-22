import React, { useState, useMemo, useCallback } from 'react';
import { Grade, Unit, User, Teacher } from '../../types';
import { getUserProgress, getTeachers } from '../../services/storageService';
import { ArrowRightIcon, ChevronLeftIcon, GlobeAltIcon, HistoryIcon, ChartSquareBarIcon, PencilEditIcon, XCircleIcon } from '../common/Icons';

interface SubjectSelectionScreenProps {
    grade: Grade;
    onSubjectSelect: (unit: Unit) => void;
    onBack: () => void;
    user: User;
    teacherId?: string | null;
    onClearTeacherFilter: () => void;
}

const subjectIcons: Record<string, React.FC<{className?: string}>> = {
    'الجغرافيا': GlobeAltIcon,
    'التاريخ': HistoryIcon,
    'الإحصاء': ChartSquareBarIcon,
    // Add other subjects here
};

const LinearProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 overflow-hidden">
        <div 
            className="bg-gradient-to-r from-teal-400 to-cyan-500 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
        ></div>
    </div>
);


const CourseProgressCard: React.FC<{ unit: Unit; teacher?: Teacher; onClick: () => void; progress: number }> = ({ unit, teacher, onClick, progress }) => {
    return (
        <div
            onClick={onClick}
            className="bg-[var(--bg-secondary)] rounded-2xl shadow-md border border-[var(--border-primary)] transition-all duration-300 cursor-pointer overflow-hidden transform hover:border-[var(--border-secondary)] hover:shadow-lg fade-in group p-4 flex items-center space-x-4 space-x-reverse"
        >
            {teacher && (
                <div className="relative flex-shrink-0">
                    <img src={teacher.imageUrl} alt={teacher.name} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center border-2 border-[var(--bg-secondary)]">
                       <GlobeAltIcon className="w-4 h-4 text-cyan-400"/>
                    </div>
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-secondary)]">
                    {unit.title}
                </p>
                <h3 className="text-md font-bold text-[var(--text-primary)] truncate mt-1">
                    أ / {teacher?.name || 'مدرس غير محدد'}
                </h3>
                <div className="mt-3">
                    <LinearProgressBar progress={progress} />
                </div>
            </div>
             <div className="flex-shrink-0">
                <ChevronLeftIcon className="w-6 h-6 text-[var(--text-secondary)] transition-transform duration-300 group-hover:-translate-x-1" />
            </div>
        </div>
    );
};

const SubjectSelectionScreen: React.FC<SubjectSelectionScreenProps> = ({ grade, onSubjectSelect, onBack, user, teacherId, onClearTeacherFilter }) => {
    const [activeFilter, setActiveFilter] = useState('الكل');
    
    const userProgress = useMemo(() => getUserProgress(user.id), [user.id]);
    const teachers = useMemo(() => getTeachers(), []);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const selectedTeacher = useMemo(() => teacherId ? teacherMap.get(teacherId) : null, [teacherId, teacherMap]);

    const calculateProgress = useCallback((unit: Unit) => {
        const totalLessons = unit.lessons.length;
        if (totalLessons === 0) return 0;
        
        const completedLessons = unit.lessons.filter(lesson => userProgress[lesson.id]).length;
        return Math.round((completedLessons / totalLessons) * 100);
    }, [userProgress]);

    const activeSemester = useMemo(() => {
        // For simplicity, we combine all units from all semesters for this grade.
        // This avoids having to manage semester state when filtering by teacher.
        return {
            id: 'all',
            title: 'All Semesters',
            units: grade.semesters.flatMap(s => s.units)
        };
    }, [grade]);

    const trackName = user.track === 'Literary' ? 'أدبي عام' : (user.track === 'Scientific' ? 'علمي' : 'عام');

    const unitsByTeacher = useMemo(() => {
        if (!activeSemester) return [];
        if (teacherId) {
            return activeSemester.units.filter(u => u.teacherId === teacherId);
        }
        return activeSemester.units;
    }, [activeSemester, teacherId]);

    const subjectFilters = useMemo(() => {
        const uniqueSubjects = [...new Set(unitsByTeacher.map(u => u.title))];
        return ['الكل', ...uniqueSubjects];
    }, [unitsByTeacher]);

    const filteredUnits = useMemo(() => {
        if (activeFilter === 'الكل') return unitsByTeacher;
        return unitsByTeacher.filter(u => u.title === activeFilter);
    }, [unitsByTeacher, activeFilter]);


    return (
        <div className="pb-16">
            {!selectedTeacher && (
                <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>العودة إلى الرئيسية</span>
                </button>
            )}

            <div className="flex items-center space-x-2 space-x-reverse text-2xl md:text-3xl font-bold mb-4 text-[var(--text-primary)]">
                <PencilEditIcon className="w-7 h-7" />
                <h1>{selectedTeacher ? `مواد أ. ${selectedTeacher.name}` : `${grade.name} ${trackName}`}</h1>
            </div>

            {selectedTeacher ? (
                 <div className="mb-8">
                    <button onClick={onClearTeacherFilter} className="flex items-center space-x-2 space-x-reverse px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <XCircleIcon className="w-5 h-5"/>
                        <span>عرض كل المدرسين</span>
                    </button>
                 </div>
            ) : (
                <div className="flex items-center space-x-2 space-x-reverse mb-8 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}>
                     {subjectFilters.map(subject => {
                        const Icon = subjectIcons[subject] || null;
                        const isActive = activeFilter === subject;
                        return (
                            <button
                                key={subject}
                                onClick={() => setActiveFilter(subject)}
                                className={`flex-shrink-0 px-4 py-2.5 rounded-full font-semibold transition-all duration-300 text-sm md:text-base flex items-center space-x-2 space-x-reverse shadow-sm
                                ${isActive
                                    ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]'
                                }`}
                            >
                               {Icon && <Icon className="w-5 h-5"/>}
                               <span>{subject}</span>
                            </button>
                        )
                     })}
                </div>
            )}


            {activeSemester ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUnits.map((unit) => (
                        <CourseProgressCard 
                            key={unit.id} 
                            unit={unit} 
                            teacher={unit.teacherId ? teacherMap.get(unit.teacherId) : undefined}
                            onClick={() => onSubjectSelect(unit)}
                            progress={calculateProgress(unit)}
                        />
                    ))}
                     {filteredUnits.length === 0 && (
                         <div className="md:col-span-2 text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                            <p className="text-[var(--text-secondary)]">{selectedTeacher ? 'لا توجد مواد مسندة لهذا المعلم في صفك الدراسي.' : 'لا توجد مواد متاحة لهذا الفلتر.'}</p>
                        </div>
                    )}
                </div>
            ) : (
                 <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لم يتم العثور على وحدات دراسية.</p>
                </div>
            )}
        </div>
    );
};

export default SubjectSelectionScreen;
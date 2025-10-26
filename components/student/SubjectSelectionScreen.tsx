import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Grade, Unit, User, Teacher } from '../../types';
import { getStudentProgress, getTeachers } from '../../services/storageService';
import { ArrowRightIcon, ArrowLeftIcon } from '../common/Icons';

// --- Reusable Sub-components ---

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="w-full bg-gray-700/50 rounded-full h-1.5">
        <div 
            className="bg-teal-400 h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${Math.round(progress)}%` }}>
        </div>
    </div>
);

const TeacherSubjectCard: React.FC<{ unit: Unit; teacher?: Teacher; onClick: () => void; delay: number; progress: number; }> = ({ unit, teacher, onClick, delay, progress }) => {
    return (
        <div
            onClick={onClick}
            className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-[var(--border-primary)] p-4 flex items-center space-x-4 space-x-reverse transition-all duration-300 transform hover:-translate-y-1.5 hover:shadow-cyan-500/10 hover:border-cyan-500/50 cursor-pointer fade-in"
            style={{ animationDelay: `${delay}ms` }}
        >
            <img 
                src={teacher?.imageUrl || `https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png`} 
                alt={teacher?.name || unit.title} 
                className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--border-secondary)] flex-shrink-0" 
            />
            
            <div className="flex-1 min-w-0 text-right">
                <p className="text-sm text-[var(--text-secondary)] truncate">{unit.title}</p>
                <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">
                    {teacher ? `أ / ${teacher.name}` : '...'}
                </h3>
                <div className="mt-3">
                    <ProgressBar progress={progress} />
                </div>
            </div>
            
            <ArrowLeftIcon className="w-6 h-6 text-[var(--text-secondary)]" />
        </div>
    );
};

const FilterPill: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full font-bold transition-all duration-300 text-sm ${
                isActive
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]'
            }`}
        >
            <span>{label}</span>
        </button>
    );
};

// --- Main Component ---

interface SubjectSelectionScreenProps {
    grade: Grade;
    onSubjectSelect: (unit: Unit) => void;
    onBack: () => void;
    user: User;
}

const SubjectSelectionScreen: React.FC<SubjectSelectionScreenProps> = ({ grade, onSubjectSelect, onBack, user }) => {
    const [activeSemesterId, setActiveSemesterId] = useState<string>(grade.semesters[0]?.id || '');
    const [activeSubject, setActiveSubject] = useState<string>('الكل');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchTeachers = async () => {
            const data = await getTeachers();
            setTeachers(data);
        };
        fetchTeachers();
    }, []);

    useEffect(() => {
        if (!user) return;
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
    }, [user]);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    const calculateProgress = useCallback((unit: Unit) => {
        const totalLessons = unit.lessons.length;
        if (totalLessons === 0) return 0;
        
        const completedLessons = unit.lessons.filter(lesson => userProgress[lesson.id]).length;
        return (completedLessons / totalLessons) * 100;
    }, [userProgress]);

    const activeSemester = useMemo(() => grade.semesters.find(s => s.id === activeSemesterId), [grade, activeSemesterId]);

    const unitsForTrack = useMemo(() => {
        if (!activeSemester) return [];
        return activeSemester.units.filter(unit => 
            !unit.track || unit.track === 'All' || unit.track === user.track
        );
    }, [activeSemester, user.track]);

    const uniqueSubjects = useMemo(() => {
        const subjects = unitsForTrack.map(unit => unit.title);
        return ['الكل', ...Array.from(new Set(subjects))];
    }, [unitsForTrack]);

    const displayUnits = useMemo(() => {
        if (activeSubject === 'الكل') {
            return unitsForTrack;
        }
        return unitsForTrack.filter(unit => unit.title === activeSubject);
    }, [unitsForTrack, activeSubject]);

    useEffect(() => {
        setActiveSubject('الكل');
    }, [activeSemesterId]);

    const getGradeSuffix = () => {
        if (!user.track) return 'عام';
        const trackMap = {
            'Scientific': 'علمي',
            'Literary': 'أدبي',
            'Science': 'علمي علوم',
            'Math': 'علمي رياضيات'
        };
        return trackMap[user.track] || 'عام';
    }

    return (
        <div>
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى الرئيسية</span>
            </button>

            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] flex items-center">
                    <span className="w-3 h-8 bg-amber-400 rounded-sm ml-3"></span>
                     {grade.name} {getGradeSuffix()}
                </h1>
            </div>
            <p className="text-md text-[var(--text-secondary)] mb-8">اختر المادة التي تود دراستها.</p>

            {/* Semester Tabs */}
            <div className="flex items-center space-x-2 space-x-reverse mb-6 border-b border-[var(--border-primary)]">
                {grade.semesters.map(semester => (
                    <button
                        key={semester.id}
                        onClick={() => setActiveSemesterId(semester.id)}
                        className={`px-4 py-3 font-semibold transition-colors duration-300 border-b-2 text-sm md:text-base ${
                            activeSemesterId === semester.id
                                ? 'border-amber-400 text-amber-400'
                                : 'border-transparent text-[var(--text-secondary)] hover:border-gray-500 hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {semester.title}
                    </button>
                ))}
            </div>

            {/* Subject Filter Pills */}
            <div className="flex overflow-x-auto gap-3 pb-4 mb-8" style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}>
                {uniqueSubjects.map(subject => (
                    <FilterPill 
                        key={subject}
                        label={subject}
                        isActive={activeSubject === subject}
                        onClick={() => setActiveSubject(subject)}
                    />
                ))}
            </div>

            {/* Content Grid */}
            {activeSemester ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {displayUnits.map((unit, index) => (
                        <TeacherSubjectCard
                            key={`${unit.id}-${index}`}
                            unit={unit} 
                            teacher={teacherMap.get(unit.teacherId)}
                            onClick={() => onSubjectSelect(unit)} 
                            delay={index * 50}
                            progress={calculateProgress(unit)}
                        />
                    ))}
                    {displayUnits.length === 0 && (
                        <div className="lg:col-span-2 text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                            <p className="text-[var(--text-secondary)]">لا توجد مواد متاحة لهذا الاختيار حاليًا.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                    <p className="text-[var(--text-secondary)]">لم يتم العثور على مواد دراسية.</p>
                </div>
            )}
        </div>
    );
};

export default SubjectSelectionScreen;

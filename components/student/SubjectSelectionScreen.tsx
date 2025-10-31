import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Grade, Unit, User, Teacher } from '../../types';
import { getStudentProgress, getAllTeachers } from '../../services/storageService';
import { BookOpenIcon, VideoCameraIcon, PencilIcon } from '../common/Icons';
import Loader from '../common/Loader';
import { useSubscription } from '../../hooks/useSubscription';

// Component for the progress bar
const ProgressBar: React.FC<{ progress: number }> = React.memo(({ progress }) => (
    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
        <div 
            className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${Math.round(progress)}%` }}>
        </div>
    </div>
));

// Component for a single subject card
const SubjectCard: React.FC<{ unit: Unit; onClick: () => void; progress: number; }> = ({ unit, onClick, progress }) => {
    const lessonCount = unit.lessons?.filter(l => l.type === 'Explanation').length || 0;
    const homeworkCount = unit.lessons?.filter(l => l.type === 'Homework' || l.type === 'Exam').length || 0;

    return (
        <button
            onClick={onClick}
            className="w-full text-right bg-[var(--bg-secondary)] p-5 rounded-xl border border-[var(--border-primary)] transition-all duration-300 transform hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 group"
        >
            <h4 className="font-bold text-lg text-[var(--text-primary)] mb-3 truncate">{unit.title}</h4>
            <div className="flex items-center space-x-4 space-x-reverse text-xs text-[var(--text-secondary)] mb-4">
                <span className="flex items-center gap-1.5"><VideoCameraIcon className="w-4 h-4"/> {lessonCount} شرح</span>
                <span className="flex items-center gap-1.5"><PencilIcon className="w-4 h-4"/> {homeworkCount} واجب/امتحان</span>
            </div>
            <div className="flex items-center gap-3">
                <ProgressBar progress={progress} />
                <span className="text-xs font-semibold text-cyan-400">{Math.round(progress)}%</span>
            </div>
        </button>
    );
};

// Main component: The new Curriculum View
interface CurriculumViewProps {
    grade: Grade;
    onSubjectSelect: (unit: Unit) => void;
    user: User;
}

const CurriculumView: React.FC<CurriculumViewProps> = ({ grade, onSubjectSelect, user }) => {
    const { isComprehensive, activeSubscriptions } = useSubscription();

    const sortedSemesters = useMemo(() => {
        // Sort semesters (e.g., "الفصل الدراسي الأول", "الفصل الدراسي الثاني")
        return [...(grade.semesters || [])].sort((a, b) => a.title.localeCompare(b.title, 'ar-EG'));
    }, [grade.semesters]);

    const [activeSemesterId, setActiveSemesterId] = useState<string>(sortedSemesters?.[0]?.id || '');
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [teacherData, progressData] = await Promise.all([
                getAllTeachers(),
                user ? getStudentProgress(user.id) : Promise.resolve([])
            ]);
            setTeachers(teacherData);
            if (progressData) {
                const progressMap = progressData.reduce((acc, item) => {
                    acc[item.lesson_id] = true;
                    return acc;
                }, {} as Record<string, boolean>);
                setUserProgress(progressMap);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    const activeSemester = useMemo(() => {
        return sortedSemesters.find(s => s.id === activeSemesterId);
    }, [sortedSemesters, activeSemesterId]);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    const calculateProgress = useCallback((unit: Unit): number => {
        const lessons = unit.lessons || [];
        const totalLessons = lessons.length;
        if (totalLessons === 0) return 0;
        
        const completedLessons = lessons.filter(lesson => userProgress[lesson.id]).length;
        return (completedLessons / totalLessons) * 100;
    }, [userProgress]);

    const unitsByTeacher = useMemo(() => {
        if (!activeSemester) return new Map<string, Unit[]>();
        
        const unitsForTrack = (activeSemester.units || []).filter(unit => {
            if (!unit.track || unit.track === 'All') return true;
            if (user.track === 'Scientific' && (unit.track === 'Scientific' || unit.track === 'Science' || unit.track === 'Math')) return true;
            return unit.track === user.track;
        });

        const grouped = new Map<string, Unit[]>();
        unitsForTrack.forEach(unit => {
            if (!grouped.has(unit.teacherId)) {
                grouped.set(unit.teacherId, []);
            }
            grouped.get(unit.teacherId)!.push(unit);
        });

        // NEW FILTERING LOGIC
        if (!isComprehensive && activeSubscriptions.length > 0) {
            const subscribedTeacherIds = new Set(activeSubscriptions.map(s => s.teacherId));
            const filteredGrouped = new Map<string, Unit[]>();
            for (const [teacherId, units] of grouped.entries()) {
                if (subscribedTeacherIds.has(teacherId)) {
                    filteredGrouped.set(teacherId, units);
                }
            }
            
            // Sort units within each teacher's group (existing logic)
            filteredGrouped.forEach((units) => {
                units.sort((a, b) => a.title.localeCompare(b.title, 'ar-EG', { numeric: true }));
            });
            return filteredGrouped;
        }


        // Sort units within each teacher's group
        grouped.forEach((units) => {
            units.sort((a, b) => a.title.localeCompare(b.title, 'ar-EG', { numeric: true }));
        });

        return grouped;
    }, [activeSemester, user.track, isComprehensive, activeSubscriptions]);

    return (
        <div className="fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-[var(--text-primary)]">{grade.name}</h1>
                <p className="text-md text-[var(--text-secondary)] mt-1">تصفح موادك الدراسية لكل فصل دراسي.</p>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse mb-8 border-b border-[var(--border-primary)]">
                {sortedSemesters.map(semester => (
                    <button
                        key={semester.id}
                        onClick={() => setActiveSemesterId(semester.id)}
                        className={`px-4 py-3 font-semibold transition-colors duration-300 border-b-2 text-sm md:text-base ${
                            activeSemesterId === semester.id
                                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                : 'border-transparent text-[var(--text-secondary)] hover:border-gray-500 hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {semester.title}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader /></div>
            ) : unitsByTeacher.size > 0 ? (
                <div className="space-y-8">
                    {Array.from(unitsByTeacher.entries()).map(([teacherId, units], index) => {
                        const teacher = teacherMap.get(teacherId);
                        if (!teacher) return null;
                        
                        return (
                            <div key={teacherId} className="fade-in" style={{ animationDelay: `${index * 100}ms`}}>
                                <div className="flex items-center gap-4 mb-4">
                                    <img 
                                        src={teacher.imageUrl || `https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png`} 
                                        alt={teacher.name} 
                                        className="w-12 h-12 rounded-full object-cover border-2 border-[var(--border-secondary)]" 
                                    />
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{teacher.name}</h2>
                                        <p className="text-sm text-[var(--text-secondary)]">{teacher.subject}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {units.map(unit => (
                                        <SubjectCard 
                                            key={unit.id} 
                                            unit={unit}
                                            onClick={() => onSubjectSelect(unit)}
                                            progress={calculateProgress(unit)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                    <BookOpenIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <p className="text-[var(--text-secondary)]">لم يتم إضافة مواد لهذا الفصل الدراسي بعد أو أن اشتراكك لا يغطي المواد المتاحة.</p>
                </div>
            )}
        </div>
    );
};

export default CurriculumView;
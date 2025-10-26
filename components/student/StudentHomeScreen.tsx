import React, { useMemo, useState, useEffect } from 'react';
import { Teacher, User, StudentView, Unit, Lesson, LessonType } from '../../types';
import { getTeachers, getGradeById, getStudentProgress } from '../../services/storageService';
import { DocumentTextIcon, VideoCameraIcon, ClockIcon } from '../common/Icons';

// --- NEW HOME SCREEN COMPONENTS ---

interface ContinueLearningItem {
    lesson: Lesson;
    unit: Unit;
    progress?: number; // For explanation type
}

interface ContinueAssignmentItem {
    lesson: Lesson;
    unit: Unit;
    daysRemaining: number;
}

const ContinueLearningCard: React.FC<{
    item: ContinueLearningItem | ContinueAssignmentItem;
    onNavigate: (unit: Unit, lesson: Lesson) => void;
}> = ({ item, onNavigate }) => {
    const { lesson, unit } = item;
    const isAssignment = 'daysRemaining' in item;

    const Icon = isAssignment ? DocumentTextIcon : VideoCameraIcon;
    const iconBg = isAssignment ? 'bg-sky-500/20' : 'bg-purple-500/20';
    const iconText = isAssignment ? 'text-sky-400' : 'text-purple-400';

    return (
        <button 
            onClick={() => onNavigate(unit, lesson)}
            className="home-card w-full p-4 rounded-2xl text-right"
        >
            <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-8 h-8 ${iconText}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-lg text-[var(--text-primary)] truncate">{lesson.title}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{`${unit.title}`}</p>
                </div>
            </div>
            <div className="mt-4">
                {isAssignment ? (
                    <div className="flex items-center text-xs text-amber-400">
                        <ClockIcon className="w-4 h-4 ml-2" />
                        <span>
                            {item.daysRemaining === 0 ? 'موعد التسليم: اليوم' : item.daysRemaining === 1 ? 'موعد التسليم: غداً' : `متبقي ${item.daysRemaining} أيام`}
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-1 text-xs text-[var(--text-secondary)]">
                            <span>التقدم في الوحدة</span>
                            <span className="font-semibold">{item.progress?.toFixed(0) || 0}%</span>
                        </div>
                        <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-1.5">
                            <div 
                                className="progress-bar-gradient h-1.5 rounded-full" 
                                style={{ width: `${item.progress || 0}%` }}>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </button>
    );
};


// Main Component
interface StudentHomeScreenProps {
    user: User;
    onNavigate: (view: StudentView, data?: { unit: Unit, lesson: Lesson }) => void;
}

const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ user, onNavigate }) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
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

    const { overallProgress, continueLearningItem, nextAssignmentItem } = useMemo(() => {
        if (!grade) return { overallProgress: 0 };
        
        const allLessonsForTrack = grade.semesters.flatMap(s => s.units.filter(u => !u.track || u.track === 'All' || u.track === user.track)).flatMap(u => u.lessons);
        const completedCount = allLessonsForTrack.filter(l => userProgress[l.id]).length;
        const overallProgress = allLessonsForTrack.length > 0 ? (completedCount / allLessonsForTrack.length) * 100 : 0;

        let continueLearningItem: ContinueLearningItem | undefined;
        let nextAssignmentItem: ContinueAssignmentItem | undefined;

        for (const semester of grade.semesters) {
            const unitsForTrack = semester.units.filter(u => !u.track || u.track === 'All' || u.track === user.track);
            for (const unit of unitsForTrack) {
                const nextLesson = unit.lessons.find(l => l.type === LessonType.EXPLANATION && !userProgress[l.id]);
                if (nextLesson) {
                    const completedInUnit = unit.lessons.filter(l => userProgress[l.id]).length;
                    const unitProgress = unit.lessons.length > 0 ? (completedInUnit / unit.lessons.length) * 100 : 0;
                    continueLearningItem = { lesson: nextLesson, unit, progress: unitProgress };
                    break;
                }
            }
            if (continueLearningItem) break;
        }

        const upcomingAssignments = grade.semesters
            .flatMap(s => s.units.filter(u => !u.track || u.track === 'All' || u.track === user.track))
            .flatMap(u => u.lessons.map(l => ({ lesson: l, unit: u })))
            .filter(({ lesson }) => (lesson.type === LessonType.HOMEWORK || lesson.type === LessonType.EXAM) && !userProgress[lesson.id] && lesson.dueDate)
            .map(({ lesson, unit }) => {
                const dueDate = new Date(lesson.dueDate!);
                const now = new Date();
                dueDate.setHours(0, 0, 0, 0);
                now.setHours(0, 0, 0, 0);
                const diffTime = dueDate.getTime() - now.getTime();
                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return { lesson, unit, daysRemaining };
            })
            .filter(({ daysRemaining }) => daysRemaining >= 0)
            .sort((a, b) => a.daysRemaining - b.daysRemaining);
            
        if (upcomingAssignments.length > 0) {
            nextAssignmentItem = upcomingAssignments[0];
        }

        return { overallProgress, continueLearningItem, nextAssignmentItem };
    }, [grade, user.track, userProgress]);

    const handleCardClick = (unit: Unit, lesson: Lesson) => {
        onNavigate('grades', { unit, lesson });
    };

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-start fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">أهلاً بعودتك، {user.name.split(' ')[0]}!</h1>
                    <p className="text-md text-[var(--text-secondary)] mt-1">لنكمل رحلتنا نحو التفوق.</p>
                </div>
                <div className="home-card p-4 rounded-2xl text-center flex-shrink-0">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">معدل الإنجاز</p>
                    <p className="text-2xl font-bold gradient-text">{overallProgress.toFixed(0)}%</p>
                </div>
            </header>

            <section className="fade-in" style={{ animationDelay: '100ms' }}>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">واصل التعلم</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {continueLearningItem ? (
                        <ContinueLearningCard item={continueLearningItem} onNavigate={handleCardClick} />
                    ) : (
                        <div className="home-card p-6 rounded-2xl flex items-center justify-center text-center text-[var(--text-secondary)] md:col-span-2">
                            <p>رائع! لقد أكملت جميع الدروس المتاحة.</p>
                        </div>
                    )}
                    {nextAssignmentItem && (
                        <ContinueLearningCard item={nextAssignmentItem} onNavigate={handleCardClick} />
                    )}
                </div>
            </section>
            
            {teachers.length > 0 && (
                <section className="fade-in" style={{ animationDelay: '200ms' }}>
                    <header className="flex justify-between items-center mb-4 px-2">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">نخبة من المدرسين</h2>
                        <button onClick={() => onNavigate('teachers')} className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            عرض الكل
                        </button>
                    </header>
                    <div
                        className="flex overflow-x-auto gap-6 p-2"
                        style={{ scrollbarWidth: 'none', '-ms-overflow-style': 'none' }}
                    >
                         {teachers.slice(0, 6).map(teacher => (
                             <div key={teacher.id} className="flex-shrink-0 w-28 text-center group cursor-pointer" onClick={() => onNavigate('teachers')}>
                                <img src={teacher.imageUrl} alt={teacher.name} className="w-24 h-24 rounded-full mx-auto mb-2 border-4 border-transparent group-hover:border-[var(--accent-primary)] transition-all duration-300" />
                                <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{teacher.name}</h3>
                            </div>
                         ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default StudentHomeScreen;

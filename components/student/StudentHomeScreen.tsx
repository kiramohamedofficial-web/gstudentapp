import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Teacher, User, StudentView, Unit, Lesson, WatchedVideo, PlatformSettings, ToastType } from '../../types';
import { getAllTeachers, getGradeById, getStudentProgress, getPlatformSettings, getTotalLessonCountForGrade, getNewestLessonsWithUnits } from '../../services/storageService';
import { VideoCameraIcon, ClockIcon } from '../common/Icons';
import { useToast } from '../../useToast';

interface StudentHomeScreenProps {
    user: User;
    onNavigate: (view: StudentView, data?: { unit?: Unit, lesson?: Lesson, teacher?: Teacher }) => void;
}

const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ user, onNavigate }) => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
    const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [watchedHistory, setWatchedHistory] = useState<WatchedVideo[]>([]);
    const { addToast } = useToast();

    // Performance-optimized state
    const [overallProgress, setOverallProgress] = useState(0);
    const [newestLessons, setNewestLessons] = useState<{ lesson: Lesson, unit: Unit }[]>([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                const [teacherData, settingsData] = await Promise.all([
                    getAllTeachers(),
                    getPlatformSettings()
                ]);
                setTeachers(teacherData);
                setSettings(settingsData);
                
                const historyJSON = localStorage.getItem('watchedVideoHistory');
                if (historyJSON) {
                    setWatchedHistory(JSON.parse(historyJSON));
                }
            } catch (error) {
                console.error("Error fetching static home screen data:", error);
                addToast('فشل تحميل بيانات الصفحة الرئيسية.', ToastType.ERROR);
            }
        };
        fetchStaticData();
    }, [addToast]);
    
    useEffect(() => {
        if (!user || !grade) {
            setIsLoadingStats(false);
            return;
        }

        const fetchPerformanceData = async () => {
            setIsLoadingStats(true);
            try {
                const progressData = await getStudentProgress(user.id);
                const totalLessonsCount = getTotalLessonCountForGrade(user.grade, user.track);
                const newestLessonsData = getNewestLessonsWithUnits(grade.id, user.track, 2);

                const progressMap = progressData.reduce((acc, item) => {
                    acc[item.lesson_id] = true;
                    return acc;
                }, {} as Record<string, boolean>);
                setUserProgress(progressMap);

                const completedCount = Object.keys(progressMap).length;
                setOverallProgress(totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0);
                
                setNewestLessons(newestLessonsData);

            } catch (error) {
                console.error("Error fetching performance-critical data:", error);
                addToast('فشل تحميل إحصائيات التقدم.', ToastType.ERROR);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchPerformanceData();
    }, [user, grade, addToast]);


     const calculateUnitProgress = useCallback((unitId: string) => {
        if (!grade) return 0;
        const unit = grade.semesters.flatMap(s => s.units).find(u => u.id === unitId);
        if (!unit || unit.lessons.length === 0) return 0;
        const completed = unit.lessons.filter(l => userProgress[l.id]).length;
        return (completed / unit.lessons.length) * 100;
    }, [grade, userProgress]);


    const lastWatched = watchedHistory.length > 0 ? watchedHistory[0] : null;
    const unitForLastWatched = lastWatched ? grade?.semesters.flatMap(s => s.units).find(u => u.id === lastWatched.unitId) : null;
    const lessonForLastWatched = lastWatched && unitForLastWatched ? unitForLastWatched.lessons.find(l => l.id === lastWatched.lessonId) : null;
    const progressForLastWatched = lastWatched ? calculateUnitProgress(lastWatched.unitId) : 0;
    
    const fallbackTeacherImage = 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png';

    return (
        <div className="space-y-6">

            <section className="bg-[var(--bg-secondary)] rounded-2xl p-6 flex justify-between items-center shadow-lg mb-6">
                <div>
                    <h1 className="m-0 mb-1 text-2xl font-bold text-[var(--text-primary)]">أهلاً بعودتك، {user.name.split(' ')[0]}!</h1>
                    <p className="m-0 text-base text-[var(--text-secondary)]">{grade?.name || ''}</p>
                </div>
                <div className="relative w-[70px] h-[70px] flex-shrink-0" style={{ '--progress': Math.round(overallProgress) } as React.CSSProperties}>
                    <div className="w-full h-full rounded-full transition-all duration-500 ease-in-out" style={{ background: `conic-gradient(var(--accent-primary) calc(var(--progress, 0) * 1%), var(--bg-tertiary) 0%)` }}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[55px] h-[55px] bg-[var(--bg-secondary)] rounded-full flex justify-center items-center text-lg font-bold text-[var(--accent-primary)]">{Math.round(overallProgress)}%</div>
                </div>
            </section>

            {lastWatched && lessonForLastWatched && unitForLastWatched && (
            <section>
                <header className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold m-0 flex items-center gap-2">⏱️ واصل التعلم</h2>
                </header>
                 <button onClick={() => onNavigate('grades', { unit: unitForLastWatched, lesson: lessonForLastWatched })} className="w-full text-right bg-[var(--bg-secondary)] rounded-2xl p-5 flex items-center gap-4 shadow-lg mb-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="w-12 h-12 flex-shrink-0 bg-[var(--accent-primary)] rounded-xl flex justify-center items-center text-white">
                        <VideoCameraIcon className="w-6 h-6"/>
                    </div>
                    <div className="w-full">
                        <h3 className="m-0 mb-1 text-lg">{lastWatched.lessonTitle}</h3>
                        <p className="m-0 mb-3 text-sm text-[var(--text-secondary)]">{lastWatched.unitTitle}</p>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progressForLastWatched}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}></div>
                        </div>
                    </div>
                </button>
            </section>
            )}

            {settings?.announcementBanner?.enabled && settings.announcementBanner.text && (
                <section 
                    className="text-white text-center p-5 my-5 rounded-2xl shadow-lg relative overflow-hidden"
                    style={{ 
                        background: settings.announcementBanner.imageUrl 
                            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${settings.announcementBanner.imageUrl})`
                            : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        backgroundSize: 'cover', backgroundPosition: 'center'
                    }}>
                    <div className="absolute top-2.5 left-2.5 bg-[var(--accent-primary)] text-white px-2.5 py-1 rounded-full text-xs font-semibold z-10">عرض خاص</div>
                    <h2 className="m-0 mb-2 text-xl relative z-10" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{settings.announcementBanner.text}</h2>
                    {settings.announcementBanner.subtitle && (
                        <p className="text-base m-auto relative opacity-95 z-10" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{settings.announcementBanner.subtitle}</p>
                    )}
                </section>
            )}

            <section>
                 <header className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold m-0 flex items-center gap-2">📚 الحصص الجديدة</h2>
                    <button onClick={() => onNavigate('grades')} className="text-sm text-[var(--accent-primary)] font-semibold">عرض الكل</button>
                </header>
                <p className="text-[var(--text-secondary)] text-sm mb-5 leading-relaxed">اختر من بين أحدث الدروس المُعدة بعناية لمساعدتك على تحقيق أهدافك التعليمية</p>
                
                <div className="grid grid-cols-1 gap-5 mb-6">
                    {newestLessons.map(({ lesson, unit }) => (
                        <article key={lesson.id} onClick={() => onNavigate('grades', { unit, lesson })} className="cursor-pointer bg-[var(--bg-secondary)] rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-transparent hover:border-[var(--border-primary)]">
                            <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs z-10">45 دقيقة</div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-base font-bold m-0 mb-2.5 text-[var(--text-primary)] leading-snug line-clamp-2">{lesson.title}</h3>
                                <p className="text-sm text-[var(--text-secondary)] m-0 flex items-center gap-1.5">
                                    <span className="text-[var(--accent-primary)]">👤</span> {teacherMap.get(unit.teacherId)?.name || '...'}
                                </p>
                                <div className="flex justify-between mt-3 text-xs text-[var(--text-secondary)]">
                                     <span>{unit.title}</span>
                                     <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {unit.lessons.length} درس</span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {watchedHistory.length > 0 && (
            <section>
                 <header className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold m-0 flex items-center gap-2">⏱️ آخر ما شاهدت</h2>
                </header>
                 <p className="text-[var(--text-secondary)] text-sm mb-5 leading-relaxed">تتم مزامنة هذه البيانات تلقائيًا مع متصفحك</p>

                 <div className="grid grid-cols-1 gap-5 mb-6">
                    {watchedHistory.slice(0, 2).map((item, index) => {
                         const unit = grade?.semesters.flatMap(s => s.units).find(u => u.id === item.unitId);
                         const lesson = unit?.lessons.find(l => l.id === item.lessonId);
                         if (!unit || !lesson) return null;
                         const progress = calculateUnitProgress(unit.id);
                         const imageUrl = index === 0 
                            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                            : "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
                        return (
                            <article key={item.lessonId} onClick={() => onNavigate('grades', { unit, lesson })} className="cursor-pointer flex items-start bg-[var(--bg-secondary)] rounded-2xl shadow-lg p-4 gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className="w-24 h-[75px] rounded-lg bg-cover flex-shrink-0 relative overflow-hidden" style={{ backgroundImage: `url(${imageUrl})`}}></div>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold m-0 mb-2 leading-snug line-clamp-2">{item.lessonTitle}</h3>
                                    <div className="flex items-center gap-2.5 mt-2">
                                        <span className="text-xs text-[var(--text-secondary)] min-w-[50px]">{Math.round(progress)}%</span>
                                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                 </div>
            </section>
            )}

            <section>
                <header className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold m-0 flex items-center gap-2">👨‍🏫 نخبة من المدرسين</h2>
                    <button onClick={() => onNavigate('teachers')} className="text-sm text-[var(--accent-primary)] font-semibold">عرض الكل</button>
                </header>
                <p className="text-[var(--text-secondary)] text-sm mb-5 leading-relaxed">افتح معرفتك مع أفضل الخبراء في مجالاتهم</p>

                <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', direction: 'rtl' }}>
                    {teachers.slice(0, 5).map(teacher => (
                        <div key={teacher.id} onClick={() => onNavigate('teacherProfile', { teacher })} className="text-center flex-shrink-0 w-20 cursor-pointer">
                            <div className="w-[75px] h-[75px] rounded-full mx-auto mb-2.5 bg-gray-200 bg-cover bg-center border-2 border-[var(--bg-secondary)] shadow-md transition-all duration-300 hover:scale-110" style={{ backgroundImage: `url(${teacher.imageUrl || fallbackTeacherImage})` }}></div>
                            <p className="m-0 text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">{teacher.name}</p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default StudentHomeScreen;
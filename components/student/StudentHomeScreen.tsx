import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Teacher, User, StudentView, Unit, Lesson, WatchedVideo, PlatformSettings, ToastType } from '../../types';
import { getAllTeachers, getGradeById, getStudentProgress, getPlatformSettings } from '../../services/storageService';
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

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teacherData, progressData, settingsData] = await Promise.all([
                    getAllTeachers(),
                    user ? getStudentProgress(user.id) : Promise.resolve([]),
                    getPlatformSettings()
                ]);
                setTeachers(teacherData);
                setSettings(settingsData);
                if (progressData) {
                     const progressMap = progressData.reduce((acc, item) => {
                        acc[item.lesson_id] = true;
                        return acc;
                    }, {} as Record<string, boolean>);
                    setUserProgress(progressMap);
                }
                const historyJSON = localStorage.getItem('watchedVideoHistory');
                if (historyJSON) {
                    setWatchedHistory(JSON.parse(historyJSON));
                }
            } catch (error) {
                console.error("Error fetching home screen data:", error);
                addToast('فشل تحميل بيانات الصفحة الرئيسية.', ToastType.ERROR);
            }
        };
        fetchData();
    }, [user, addToast]);

    const { overallProgress, newestLessons } = useMemo(() => {
        if (!grade) return { overallProgress: 0, newestLessons: [] };
        
        const allUnitsForTrack = grade.semesters.flatMap(s => s.units.filter(u => !u.track || u.track === 'All' || u.track === user.track));
        const allLessonsForTrack = allUnitsForTrack.flatMap(u => u.lessons);
        
        const completedCount = allLessonsForTrack.filter(l => userProgress[l.id]).length;
        const total = allLessonsForTrack.length;
        const progress = total > 0 ? (completedCount / total) * 100 : 0;
        
        const allLessonsWithUnits = allUnitsForTrack.flatMap(unit => 
            unit.lessons.map(lesson => ({ lesson, unit }))
        );

        const newest = [...allLessonsWithUnits].reverse().slice(0, 2);
        
        return { 
            overallProgress: progress, 
            newestLessons: newest
        };
    }, [grade, user.track, userProgress]);

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
    
    const styles = {
        '--primary-color': '#4361ee', '--primary-light': '#4895ef', '--secondary-color': '#3f37c9',
        '--accent-color': '#f72585', '--success-color': '#4cc9f0', '--bg-color': 'var(--bg-secondary)',
        '--card-bg': 'var(--bg-primary)', '--text-dark': 'var(--text-primary)', '--text-muted': 'var(--text-secondary)',
        '--border-radius': '16px', '--shadow': 'var(--shadow-md)', '--shadow-hover': 'var(--shadow-lg)',
        '--transition': 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    };
    
    const fallbackTeacherImage = 'https://i.ibb.co/k5y5nJg/imgbb-com-image-not-found.png';

    return (
        <div style={styles as React.CSSProperties} className="space-y-6">

            <section className="welcome-card" style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow)', marginBottom: '25px'}}>
                <div className="welcome-text">
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-dark)'}}>أهلاً بعودتك، {user.name.split(' ')[0]}!</h1>
                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-muted)' }}>{grade?.name || ''}</p>
                </div>
                <div className="progress-donut" style={{ '--progress': Math.round(overallProgress), width: '70px', height: '70px', position: 'relative', flexShrink: 0 } as React.CSSProperties}>
                    <div className="progress-donut-circle" style={{ width: '100%', height: '100%', borderRadius: '50%', background: `conic-gradient(var(--primary-color) calc(var(--progress, 0) * 1%), #E0E8F5 0%)`, transition: 'background 0.5s ease' }}></div>
                    <div className="progress-donut-center" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '55px', height: '55px', backgroundColor: 'var(--card-bg)', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-color)' }}>{Math.round(overallProgress)}%</div>
                </div>
            </section>

            {lastWatched && lessonForLastWatched && unitForLastWatched && (
            <section>
                <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 className="section-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="section-title-icon">⏱️</span>
                        واصل التعلم
                    </h2>
                </header>
                 <button onClick={() => onNavigate('grades', { unit: unitForLastWatched, lesson: lessonForLastWatched })} className="continue-learning-card" style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius)', padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: 'var(--shadow)', marginBottom: '25px', transition: 'var(--transition)', width: '100%', textAlign: 'right' }}>
                    <div className="continue-icon" style={{width: '50px', height: '50px', flexShrink: 0, backgroundColor: 'var(--primary-color)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white'}}>
                        <VideoCameraIcon className="w-6 h-6"/>
                    </div>
                    <div className="continue-info" style={{ width: '100%' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{lastWatched.lessonTitle}</h3>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>{lastWatched.unitTitle}</p>
                        <div className="progress-bar" style={{ width: '100%', height: '8px', backgroundColor: '#E0E8F5', borderRadius: '4px', overflow: 'hidden' }}>
                            <div className="progress-bar-inner" style={{ height: '100%', width: `${progressForLastWatched}%`, background: 'linear-gradient(90deg, var(--primary-color), var(--primary-light))', borderRadius: '4px', transition: 'width 0.5s ease' }}></div>
                        </div>
                    </div>
                </button>
            </section>
            )}

            {settings?.announcementBanner?.enabled && settings.announcementBanner.text && (
                <section 
                    className="top-ad-banner" 
                    style={{ 
                        background: settings.announcementBanner.imageUrl 
                            ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${settings.announcementBanner.imageUrl})`
                            : 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                        backgroundSize: 'cover', backgroundPosition: 'center', color: 'white', textAlign: 'center', padding: '20px 15px', 
                        margin: '20px 0', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden' 
                    }}>
                    <div className="ad-badge" style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--accent-color)', color: 'white', padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, zIndex: 2 }}>عرض خاص</div>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', position: 'relative', zIndex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{settings.announcementBanner.text}</h2>
                    {settings.announcementBanner.subtitle && (
                        <p style={{ fontSize: '1rem', margin: '0 auto', position: 'relative', opacity: 0.95, zIndex: 1, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{settings.announcementBanner.subtitle}</p>
                    )}
                </section>
            )}

            <section>
                 <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 className="section-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="section-title-icon">📚</span>
                        الحصص الجديدة
                    </h2>
                    <button onClick={() => onNavigate('grades')} className="section-link" style={{ fontSize: '0.9rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>عرض الكل</button>
                </header>
                <p className="section-description" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>اختر من بين أحدث الدروس المُعدة بعناية لمساعدتك على تحقيق أهدافك التعليمية</p>
                
                <div className="lessons-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '25px' }}>
                    {newestLessons.map(({ lesson, unit }, index) => (
                        <article key={lesson.id} onClick={() => onNavigate('grades', { unit, lesson })} className="lesson-card cursor-pointer" style={{ backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow)', overflow: 'hidden', transition: 'var(--transition)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div className="lesson-thumbnail" style={{ height: '160px', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', backgroundImage: `url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60')` }}>
                                <div style={{ content: '""', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)' }}></div>
                                <div className="lesson-duration" style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', zIndex: 1 }}>45 دقيقة</div>
                            </div>
                            <div className="lesson-info" style={{ padding: '18px' }}>
                                <h3 className="lesson-title" style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 10px 0', color: 'var(--text-dark)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lesson.title}</h3>
                                <p className="lesson-instructor" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span className="instructor-icon" style={{ color: 'var(--primary-color)' }}>👤</span> {teacherMap.get(unit.teacherId)?.name || '...'}
                                </p>
                                <div className="lesson-meta" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)'}}>
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
                 <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 className="section-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="section-title-icon">⏱️</span>
                        آخر ما شاهدت
                    </h2>
                </header>
                 <p className="section-description" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>تتم مزامنة هذه البيانات تلقائيًا مع متصفحك</p>

                 <div className="recently-watched-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '25px' }}>
                    {watchedHistory.slice(0, 2).map((item, index) => {
                         const unit = grade?.semesters.flatMap(s => s.units).find(u => u.id === item.unitId);
                         const lesson = unit?.lessons.find(l => l.id === item.lessonId);
                         if (!unit || !lesson) return null;
                         const progress = calculateUnitProgress(unit.id);
                         const imageUrl = index === 0 
                            ? "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
                            : "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
                        return (
                            <article key={item.lessonId} onClick={() => onNavigate('grades', { unit, lesson })} className="video-card cursor-pointer" style={{ display: 'flex', alignItems: 'flex-start', backgroundColor: 'var(--card-bg)', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow)', padding: '15px', gap: '15px', transition: 'var(--transition)' }}>
                                <div className="video-thumbnail" style={{ width: '100px', height: '75px', borderRadius: '10px', backgroundSize: 'cover', flexShrink: 0, position: 'relative', overflow: 'hidden', backgroundImage: `url(${imageUrl})`}}></div>
                                <div className="video-info" style={{ flex: 1 }}>
                                    <h3 className="video-title" style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.lessonTitle}</h3>
                                    <div className="video-progress-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                        <span className="video-progress-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minWidth: '50px' }}>{Math.round(progress)}%</span>
                                        <div className="video-progress-bar" style={{ flex: 1, height: '6px', backgroundColor: '#e9ecef', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div className="video-progress" style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary-color), var(--primary-light))', borderRadius: '3px', transition: 'width 0.5s ease', width: `${progress}%` }}></div>
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
                <header className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h2 className="section-title" style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="section-title-icon">👨‍🏫</span>
                        نخبة من المدرسين
                    </h2>
                    <button onClick={() => onNavigate('teachers')} className="section-link" style={{ fontSize: '0.9rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>عرض الكل</button>
                </header>
                <p className="section-description" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>افتح معرفتك مع أفضل الخبراء في مجالاتهم</p>

                <div className="teachers-list" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'none', direction: 'rtl' }}>
                    {teachers.slice(0, 5).map(teacher => (
                        <div key={teacher.id} onClick={() => onNavigate('teacherProfile', { teacher })} className="teacher-item cursor-pointer" style={{ textAlign: 'center', flexShrink: 0, width: '85px' }}>
                            <div className="teacher-avatar" style={{ width: '75px', height: '75px', borderRadius: '50%', margin: '0 auto 10px auto', backgroundColor: '#eee', backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid var(--card-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'var(--transition)', backgroundImage: `url(${teacher.imageUrl || fallbackTeacherImage})` }}></div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacher.name}</p>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default StudentHomeScreen;
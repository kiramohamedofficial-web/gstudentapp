import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { User, Grade, Subscription, QuizAttempt } from '../../types';
import { getAllUsers, getAllSubscriptions, getAllStudentProgress, getAllGrades, getAllQuizAttempts } from '../../services/storageService';
import { SearchIcon, ChevronLeftIcon, UsersIcon, VideoCameraIcon, PencilIcon, ChevronRightIcon } from '../common/Icons';
import Loader from '../common/Loader';

const StatItem: React.FC<{ icon: React.FC<any>; value: string; label: string }> = ({ icon: Icon, value, label }) => (
    <div className="flex items-center space-x-2 space-x-reverse text-sm">
        <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
        <span className="font-semibold text-[var(--text-primary)]">{value}</span>
        <span className="text-[var(--text-secondary)] hidden sm:inline">{label}</span>
    </div>
);


const StudentManagementView: React.FC<{ onViewDetails: (user: User) => void }> = ({ onViewDetails }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [subscriptions, setSubscriptions] = useState<Map<string, Subscription>>(new Map());
    const [allProgress, setAllProgress] = useState<any[]>([]);
    const [allQuizAttempts, setAllQuizAttempts] = useState<QuizAttempt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allGrades, setAllGrades] = useState<Grade[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); 

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [users, subs, progress, grades, attempts] = await Promise.all([
                getAllUsers(),
                getAllSubscriptions(),
                getAllStudentProgress(),
                getAllGrades(),
                getAllQuizAttempts()
            ]);

            setAllGrades(grades);
            setAllUsers(users.filter(u => u.role === 'student'));
            setSubscriptions(new Map(subs.map(s => [s.userId, s])));
            setAllProgress(progress);
            setAllQuizAttempts(attempts);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const progressByStudent = useMemo(() => {
        const map = new Map<string, Record<string, boolean>>();
        if (allProgress) {
            allProgress.forEach(p => {
                if (!map.has(p.student_id)) {
                    map.set(p.student_id, {});
                }
                map.get(p.student_id)![p.lesson_id] = true;
            });
        }
        return map;
    }, [allProgress]);

    const attemptsByStudent = useMemo(() => {
        const map = new Map<string, QuizAttempt[]>();
        allQuizAttempts.forEach(attempt => {
            if (!map.has(attempt.userId)) {
                map.set(attempt.userId, []);
            }
            map.get(attempt.userId)!.push(attempt);
        });
        return map;
    }, [allQuizAttempts]);

    const calculateStudentStats = useCallback((user: User, grades: Grade[], progressMap: Map<string, Record<string, boolean>>, attemptsMap: Map<string, QuizAttempt[]>): {
        watchedLessons: number;
        totalLessons: number;
        progress: number;
        completedQuizzes: number;
    } => {
        const gradeId = (user as any).grade_id;
        const grade = grades.find(g => g.id === gradeId);
        if (!grade) return { watchedLessons: 0, totalLessons: 0, progress: 0, completedQuizzes: 0 };

        const allUnitsForTrack = (grade.semesters || []).flatMap(s => (s.units || []).filter(u => !u.track || u.track === 'All' || u.track === user.track));
        const allLessons = allUnitsForTrack.flatMap(u => u.lessons || []);
        const totalLessons = allLessons.length;
        
        if (totalLessons === 0) return { watchedLessons: 0, totalLessons: 0, progress: 0, completedQuizzes: 0 };

        const userProgressLessonIds = new Set(Object.keys(progressMap.get(user.id) || {}));
        const watchedLessonsInGrade = allLessons.filter(l => userProgressLessonIds.has(l.id)).length;
        
        const progress = Math.round((watchedLessonsInGrade / totalLessons) * 100);

        const userAttempts = attemptsMap.get(user.id) || [];
        const completedQuizLessonIds = new Set(userAttempts.map(a => a.lessonId));
        const completedQuizzes = completedQuizLessonIds.size;

        return {
            watchedLessons: watchedLessonsInGrade,
            totalLessons,
            progress,
            completedQuizzes,
        };
    }, []);

    const filteredUsers = useMemo(() => {
        return allUsers
            .map(user => ({
                ...user,
                stats: calculateStudentStats(user, allGrades, progressByStudent, attemptsByStudent),
                subscription: subscriptions.get(user.id),
            }))
            .filter(user => {
                const query = debouncedSearchQuery.toLowerCase();
                const gradeId = (user as any).grade_id;
                const searchMatch = (user.name && user.name.toLowerCase().includes(query)) || (user.phone && user.phone.includes(query));
                const gradeMatch = gradeFilter ? gradeId != null && gradeId.toString() === gradeFilter : true;
                return searchMatch && gradeMatch;
            }).sort((a, b) => a.name.localeCompare(b.name));
    }, [allUsers, allGrades, progressByStudent, attemptsByStudent, subscriptions, debouncedSearchQuery, gradeFilter, calculateStudentStats]);
    
    const uniqueGrades = useMemo(() => {
        const gradeMap = new Map<string, string>();
        allUsers.forEach(u => {
            const gradeId = (u as any).grade_id;
            if (gradeId != null) {
                const gradeName = allGrades.find(grade => grade.id === gradeId)?.name || `الصف ${gradeId}`;
                gradeMap.set(gradeId.toString(), gradeName);
            }
        });
        return Array.from(gradeMap.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a,b) => parseInt(a.id) - parseInt(b.id));
    }, [allUsers, allGrades]);
    
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const paginatedUsers = useMemo(() => {
        return filteredUsers.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredUsers, currentPage]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الطلاب ({filteredUsers.length})</h1>
            
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-lg border border-[var(--border-primary)] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <input
                            type="text"
                            placeholder="ابحث بالاسم أو رقم الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 pr-10 pl-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><SearchIcon className="w-5 h-5 text-[var(--text-secondary)]" /></div>
                    </div>
                    <div>
                        <select
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                             className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">كل الصفوف</option>
                            {uniqueGrades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {paginatedUsers.length > 0 ? (
                    paginatedUsers.map(user => {
                        const gradeId = (user as any).grade_id;
                        const endDate = user.subscription?.endDate;
                        const hasActiveSub = endDate && new Date(endDate) >= new Date();

                        return (
                            <div key={user.id} className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] transition-all duration-300 hover:border-purple-400 hover:shadow-lg">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{user.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-lg text-[var(--text-primary)] truncate" dir="auto">{user.name}</p>
                                            <p className="text-sm text-[var(--text-secondary)]" dir="ltr">{user.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 self-start sm:self-center">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${hasActiveSub ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {hasActiveSub ? 'اشتراك نشط' : 'غير نشط'}
                                        </span>
                                        <button onClick={() => onViewDetails(user)} className="py-2 px-4 text-sm font-semibold text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors whitespace-nowrap flex items-center">
                                            التفاصيل <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                        </button>
                                    </div>
                                </div>
                                <div className="px-4 pb-4 pt-3 border-t border-[var(--border-primary)] flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <span className="font-semibold text-sm text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">{allGrades.find(g => g.id === gradeId)?.name || 'صف غير محدد'}</span>
                                    <div className="flex items-center gap-2 flex-grow min-w-[150px]">
                                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{width: `${user.stats.progress}%`}}></div></div>
                                        <span className="text-xs font-bold text-purple-400 w-10 text-left">{user.stats.progress}%</span>
                                    </div>
                                    <StatItem icon={VideoCameraIcon} value={`${user.stats.watchedLessons}/${user.stats.totalLessons}`} label="درس" />
                                    <StatItem icon={PencilIcon} value={user.stats.completedQuizzes.toString()} label="واجب" />
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                        <UsersIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                        <p className="text-[var(--text-secondary)]">لم يتم العثور على طلاب مطابقين لمعايير البحث.</p>
                    </div>
                )}
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="py-2 px-4 text-sm font-semibold bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                         <ChevronRightIcon className="w-4 h-4" /> السابق
                    </button>
                    <span className="font-semibold text-sm text-[var(--text-secondary)]">{currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="py-2 px-4 text-sm font-semibold bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        التالي <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default StudentManagementView;
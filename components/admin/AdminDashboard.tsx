import React, { useState, useMemo, useEffect, lazy, Suspense, useCallback } from 'react';
import { User, ActivityLog, Grade, Theme, Teacher, AdminView, Subscription, QuizAttempt, PlatformSettings } from '../../types';
import AdminLayout from '../layout/AdminLayout';
import SubscriptionManagementView from './FinancialView';
import StudentDetailView from './StudentDetailView';
import { 
    getAllUsers, 
    getActivityLogs, 
    getAllSubscriptions, 
    getAllGrades,
    getPendingSubscriptionRequestCount,
    getAllStudentProgress,
    getAllTeachers,
    getAllQuizAttempts,
    getPlatformSettings,
} from '../../services/storageService';
import { ChartBarIcon, UsersIcon, BellIcon, SearchIcon, InformationCircleIcon, UserCircleIcon, ChevronLeftIcon, VideoCameraIcon, PencilIcon, ChevronRightIcon } from '../common/Icons';
import RevenueChart from './RevenueChart';
import QrCodeGeneratorView from './QrCodeGeneratorView';
import HomeManagementView from './HomeManagementView';
import PlatformSettingsView from './PlatformSettingsView';
import AdminSettingsView from './AdminSettingsView';
import TeacherManagementView from './TeacherManagementView';
import SystemHealthView from './SystemHealthView';
import Loader from '../common/Loader';
import { useSession } from '../../hooks/useSession';

const SubscriptionPriceControlView = lazy(() => import('./SubscriptionPriceControlView'));
const CourseManagementView = lazy(() => import('./CourseManagementView'));
const ContentManagementView = lazy(() => import('./ContentManagementView'));
const DeviceManagementView = lazy(() => import('./DeviceManagementView'));
const AccountCreationDiagnosticsView = lazy(() => import('./AccountCreationDiagnosticsView'));
const TeacherCreationDiagnosticsView = lazy(() => import('./TeacherCreationDiagnosticsView'));
const FinancialReportsView = lazy(() => import('./FinancialReportsView'));
const CurriculumDiagnosticsView = lazy(() => import('./CurriculumDiagnosticsView'));
const SubscriptionCodeDiagnosticsView = lazy(() => import('./SubscriptionCodeDiagnosticsView'));


interface AdminDashboardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<{ className?: string; }>; delay: number; onClick?: () => void; }> = React.memo(({ title, value, icon: Icon, delay, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)] flex items-center space-x-4 space-x-reverse fade-in ${onClick ? 'transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-purple-500/50 cursor-pointer' : ''}`} 
        style={{animationDelay: `${delay}ms`}}
    >
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Icon className="w-8 h-8 text-purple-400" />
        </div>
        <div>
            <h3 className="text-md font-medium text-[var(--text-secondary)]">{title}</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
        </div>
    </div>
));

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

interface TeacherPerformanceData {
    id: string;
    name: string;
    imageUrl: string;
    studentCount: number;
}

const MainDashboard: React.FC<{ onNavigate: (view: AdminView) => void }> = ({ onNavigate }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, activeSubs: 0, pendingRequests: 0 });
    const [latestUsers, setLatestUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [allGrades, setAllGrades] = useState<Grade[]>([]);
    const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
    const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformanceData[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [users, teacherData, subscriptions, pendingCount, grades, settings] = await Promise.all([
                getAllUsers(),
                getAllTeachers(),
                getAllSubscriptions(),
                getPendingSubscriptionRequestCount(),
                getAllGrades(),
                getPlatformSettings()
            ]);

            setAllGrades(grades);
            const students = users.filter(u => u.role === 'student');
            setStats({
                students: students.length,
                teachers: teacherData.length,
                activeSubs: subscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) >= new Date()).length,
                pendingRequests: pendingCount,
            });
            setLatestUsers([...students].reverse().slice(0, 5));
            
            // Revenue calculation
            if (settings) {
                const prices: Record<string, number> = {
                    Monthly: settings.monthlyPrice,
                    Quarterly: settings.quarterlyPrice,
                    SemiAnnually: settings.semiAnnuallyPrice,
                    Annual: settings.annualPrice
                };
                const monthlyRevenue: { [key: string]: { revenue: number, date: Date } } = {};
                subscriptions.forEach(sub => {
                    const date = new Date(sub.startDate);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const price = prices[sub.plan] || 0;
                    if (!monthlyRevenue[monthKey]) {
                        monthlyRevenue[monthKey] = { revenue: 0, date };
                    }
                    monthlyRevenue[monthKey].revenue += price;
                });

                const sortedMonths = Object.keys(monthlyRevenue).sort((a,b) => monthlyRevenue[a].date.getTime() - monthlyRevenue[b].date.getTime());
                const last6Months = sortedMonths.slice(-6);

                const revenueForChart = last6Months.map(monthKey => ({
                    month: monthlyRevenue[monthKey].date.toLocaleString('ar-EG', { month: 'short' }),
                    revenue: monthlyRevenue[monthKey].revenue
                }));
                setRevenueData(revenueForChart);
            }

            // Teacher performance
            const performance = teacherData.map(teacher => {
                const teacherSubs = subscriptions.filter(s => s.teacherId === teacher.id);
                const studentCount = new Set(teacherSubs.map(s => s.userId)).size;
                return { id: teacher.id, name: teacher.name, imageUrl: teacher.imageUrl, studentCount };
            });
            performance.sort((a, b) => b.studentCount - a.studentCount);
            setTeacherPerformance(performance.slice(0, 5));

            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">لوحة التحكم الرئيسية</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="إجمالي الطلاب" value={stats.students.toString()} icon={UsersIcon} delay={100} onClick={() => onNavigate('students')} />
                <StatCard title="إجمالي المدرسين" value={stats.teachers.toString()} icon={UserCircleIcon} delay={200} onClick={() => onNavigate('teachers')} />
                <StatCard title="الاشتراكات النشطة" value={stats.activeSubs.toString()} icon={ChartBarIcon} delay={300} onClick={() => onNavigate('subscriptions')} />
                <div className="relative">
                     <StatCard title="طلبات جديدة" value={stats.pendingRequests.toString()} icon={InformationCircleIcon} delay={400} onClick={() => onNavigate('subscriptions')} />
                     {stats.pendingRequests > 0 && <span className="absolute top-4 right-4 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] fade-in" style={{animationDelay: '500ms'}}>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">نظرة عامة على الإيرادات</h2>
                    <RevenueChart data={revenueData} />
                </div>
                <div className="space-y-6">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] fade-in" style={{animationDelay: '600ms'}}>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><UsersIcon className="w-6 h-6 ml-2 text-purple-400"/> أفضل المدرسين</h2>
                        <div className="space-y-3">
                            {teacherPerformance.map(teacher => (
                                <div key={teacher.id} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={teacher.imageUrl} alt={teacher.name} className="w-9 h-9 rounded-full object-cover" />
                                        <p className="font-semibold text-[var(--text-primary)]">{teacher.name}</p>
                                    </div>
                                    <p className="font-bold text-purple-400">{teacher.studentCount} طالب</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  const { theme, setTheme } = props;
  const { currentUser: user, handleLogout: onLogout } = useSession();
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [studentDataVersion, setStudentDataVersion] = useState(0);

  const handleViewStudentDetails = useCallback((student: User) => {
    setSelectedStudent(student);
    setActiveView('students'); // Keep the view logical
  }, []);

  const handleBackToStudents = useCallback(() => {
    setSelectedStudent(null);
    setStudentDataVersion(v => v + 1); // Force refresh of student list
  }, []);

  const handleNavClick = useCallback((view: AdminView) => {
    setSelectedStudent(null);
    setActiveView(view);
  }, []);

  if (!user) return null;

  const renderContent = () => {
    if (selectedStudent) {
      return <StudentDetailView user={selectedStudent} onBack={handleBackToStudents} />;
    }
    
    const suspenseLoader = <div className="flex justify-center items-center h-64"><Loader /></div>;

    switch (activeView) {
      case 'subscriptions': return <SubscriptionManagementView />;
      case 'financials': return <Suspense fallback={suspenseLoader}><FinancialReportsView /></Suspense>;
      case 'subscriptionPrices': return <Suspense fallback={suspenseLoader}><SubscriptionPriceControlView /></Suspense>;
      case 'students': return <StudentManagementView key={studentDataVersion} onViewDetails={handleViewStudentDetails} />;
      case 'teachers': return <TeacherManagementView />;
      case 'homeManagement': return <HomeManagementView />;
      case 'courseManagement': return <Suspense fallback={suspenseLoader}><CourseManagementView /></Suspense>;
      case 'content': return <Suspense fallback={suspenseLoader}><ContentManagementView /></Suspense>;
      case 'tools': return <QrCodeGeneratorView />;
      case 'deviceManagement': return <Suspense fallback={suspenseLoader}><DeviceManagementView /></Suspense>;
      case 'platformSettings': return <PlatformSettingsView user={user} />;
      case 'systemHealth': return <SystemHealthView onNavigate={setActiveView} />;
      case 'accountSettings': return <AdminSettingsView theme={theme} setTheme={setTheme} />;
      case 'accountCreationDiagnostics': return <Suspense fallback={suspenseLoader}><AccountCreationDiagnosticsView /></Suspense>;
      case 'teacherCreationDiagnostics': return <Suspense fallback={suspenseLoader}><TeacherCreationDiagnosticsView /></Suspense>;
      case 'curriculumDiagnostics': return <Suspense fallback={suspenseLoader}><CurriculumDiagnosticsView onBack={() => setActiveView('systemHealth')} /></Suspense>;
      case 'subscriptionCodeDiagnostics': return <Suspense fallback={suspenseLoader}><SubscriptionCodeDiagnosticsView onBack={() => setActiveView('systemHealth')} /></Suspense>;
      case 'dashboard':
      default:
        return <MainDashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <AdminLayout user={user} onLogout={onLogout} activeView={activeView} onNavClick={handleNavClick}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { User, ActivityLog, Grade, Theme, Teacher } from '../../types';
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
    getTeachers,
} from '../../services/storageService';
import { ChartBarIcon, UsersIcon, BellIcon, SearchIcon, InformationCircleIcon, UserCircleIcon, ChevronLeftIcon } from '../common/Icons';
import RevenueChart from './RevenueChart';
import ContentManagementView from './ContentManagementView';
import QrCodeGeneratorView from './QrCodeGeneratorView';
import HomeManagementView from './HomeManagementView';
import PlatformSettingsView from './PlatformSettingsView';
import AdminSettingsView from './AdminSettingsView';
import TeacherManagementView from './TeacherManagementView';
import QuestionBankView from './QuestionBankView';
import SystemHealthView from './SystemHealthView';
import Loader from '../common/Loader';
import { useSession } from '../../hooks/useSession';

const AccountCreationDiagnosticsView = lazy(() => import('./AccountCreationDiagnosticsView'));

interface AdminDashboardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'content' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings' | 'systemHealth' | 'accountCreationDiagnostics' | 'accountSettings' | 'teachers';

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

const StudentManagementView: React.FC<{ onViewDetails: (user: User) => void }> = ({ onViewDetails }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [subscriptions, setSubscriptions] = useState<Map<string, any>>(new Map());
    const [allProgress, setAllProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const allGrades = useMemo(() => getAllGrades(), []);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const usersPromise = getAllUsers();
            const subsPromise = getAllSubscriptions();
            const progressPromise = getAllStudentProgress();

            const [users, subs, progressData] = await Promise.all([usersPromise, subsPromise, progressPromise]);

            setAllUsers(users.filter(u => u.role === 'student'));
            setSubscriptions(new Map(subs.map(s => [s.userId, s])));
            setAllProgress(progressData);
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const progressByStudent = useMemo(() => {
        const map = new Map<string, Record<string, boolean>>();
        allProgress.forEach(p => {
            if (!map.has(p.user_id)) {
                map.set(p.user_id, {});
            }
            map.get(p.user_id)![p.lesson_id] = true;
        });
        return map;
    }, [allProgress]);

    const calculateStudentProgress = (user: User, allGrades: Grade[]): number => {
        const grade = allGrades.find(g => g.id === user.grade);
        if (!grade) return 0;
        
        const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
        if (allLessons.length === 0) return 0; 

        const userProgress = progressByStudent.get(user.id) || {};
        const completed = allLessons.filter(l => !!userProgress[l.id]).length;
        return Math.round((completed / allLessons.length) * 100);
    };

    const filteredUsers = useMemo(() => {
        return allUsers
            .map(user => ({
                ...user,
                progress: calculateStudentProgress(user, allGrades),
                subscription: subscriptions.get(user.id),
            }))
            .filter(user => {
                const query = debouncedSearchQuery.toLowerCase();
                const searchMatch = (user.name && user.name.toLowerCase().includes(query)) || (user.phone && user.phone.includes(query));
                const gradeMatch = gradeFilter ? user.grade != null && user.grade.toString() === gradeFilter : true;
                return searchMatch && gradeMatch;
            });
    }, [allUsers, allGrades, debouncedSearchQuery, gradeFilter, subscriptions, progressByStudent]);
    
    const uniqueGrades = useMemo(() => {
        const gradeSet = new Set<string>();
        allUsers.forEach(u => {
            if (u.grade != null) {
                gradeSet.add(u.grade.toString());
            }
        });
        return Array.from(gradeSet).sort((a,b) => parseInt(a) - parseInt(b)).map(g => ({
            id: g,
            name: allGrades.find(grade => grade.id === parseInt(g))?.name || `الصف ${g}`
        }));
    }, [allUsers, allGrades]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الطلاب</h1>
            
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
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div key={user.id} className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] p-4 transition-all duration-300 hover:border-purple-400 hover:shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{user.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-bold text-lg text-[var(--text-primary)]">{user.name}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">{allGrades.find(g => g.id === user.grade)?.name}</p>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex justify-between items-center mb-1"><span className="text-xs font-semibold text-[var(--text-secondary)]">التقدم</span><span className="text-xs font-bold text-purple-400">{user.progress}%</span></div>
                                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{width: `${user.progress}%`}}></div></div>
                                </div>
                                <div className="flex items-center gap-4 justify-between md:justify-end">
                                     <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${user.subscription && user.subscription.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {user.subscription && user.subscription.status === 'Active' ? 'اشتراك نشط' : 'غير نشط'}
                                    </span>
                                    <button onClick={() => onViewDetails(user)} className="py-2 px-4 text-sm font-semibold text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 rounded-lg transition-colors whitespace-nowrap flex items-center">
                                        التفاصيل <ChevronLeftIcon className="w-4 h-4 mr-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                        <UsersIcon className="w-16 h-16 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                        <p className="text-[var(--text-secondary)]">لم يتم العثور على طلاب مطابقين لمعايير البحث.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const MainDashboard: React.FC<{ onNavigate: (view: AdminView) => void }> = ({ onNavigate }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, activeSubs: 0, pendingRequests: 0 });
    const [latestUsers, setLatestUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const usersPromise = getAllUsers();
            const teachersPromise = getTeachers();
            const subsPromise = getAllSubscriptions();
            const pendingPromise = getPendingSubscriptionRequestCount();

            const [users, teacherData, subscriptions, pendingCount] = await Promise.all([usersPromise, teachersPromise, subsPromise, pendingPromise]);

            const students = users.filter(u => u.role === 'student');
            setStats({
                students: students.length,
                teachers: teacherData.length,
                activeSubs: subscriptions.filter(s => s.status === 'Active').length,
                pendingRequests: pendingCount,
            });
            setLatestUsers([...students].reverse().slice(0, 5));
            setIsLoading(false);
        };
        fetchData();
    }, []);
    
    const activityLogs = useMemo(() => getActivityLogs().slice(0, 5), []);
    
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
                    <RevenueChart />
                </div>
                <div className="space-y-6">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] fade-in" style={{animationDelay: '600ms'}}>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><UsersIcon className="w-6 h-6 ml-2 text-purple-400"/> أحدث الطلاب</h2>
                        <div className="space-y-3">
                            {latestUsers.map(user => (
                                <div key={user.id} className="flex items-center text-sm">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-md flex-shrink-0 ml-3">{user.name.charAt(0)}</div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{user.name}</p>
                                        <p className="text-xs text-[var(--text-secondary)]">{getAllGrades().find(g => g.id === user.grade)?.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] fade-in" style={{animationDelay: '700ms'}}>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><BellIcon className="w-6 h-6 ml-2 text-purple-400"/> أحدث الأنشطة</h2>
                        <div className="space-y-4">
                            {activityLogs.map((log: ActivityLog) => (
                                <div key={log.id} className="flex items-start text-sm">
                                    <div className="ml-3"><p className="font-semibold text-[var(--text-primary)]">{log.action}</p><p className="text-[var(--text-secondary)]">{log.details}</p></div>
                                    <time className="text-xs text-[var(--text-secondary)] mr-auto whitespace-nowrap">{new Date(log.timestamp).toLocaleString('ar-EG', {hour: 'numeric', minute: 'numeric'})}</time>
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

  const handleViewStudentDetails = (student: User) => {
    setSelectedStudent(student);
    setActiveView('students'); // Keep the view logical
  };

  const handleBackToStudents = () => {
    setSelectedStudent(null);
  };

  const handleNavClick = (view: AdminView) => {
    setSelectedStudent(null);
    setActiveView(view);
  };

  if (!user) return null; // Should be handled by App router

  const renderContent = () => {
    if (selectedStudent) {
      return <StudentDetailView user={selectedStudent} onBack={handleBackToStudents} />;
    }

    switch (activeView) {
      case 'subscriptions': return <SubscriptionManagementView />;
      case 'students': return <StudentManagementView onViewDetails={handleViewStudentDetails} />;
      case 'teachers': return <TeacherManagementView />;
      case 'homeManagement': return <HomeManagementView />;
      case 'content': return <ContentManagementView />;
      case 'tools': return <QrCodeGeneratorView />;
      case 'questionBank': return <QuestionBankView />;
      case 'platformSettings': return <PlatformSettingsView user={user} />;
      case 'systemHealth': return <SystemHealthView />;
      case 'accountCreationDiagnostics': return <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader /></div>}><AccountCreationDiagnosticsView /></Suspense>;
      case 'accountSettings': return <AdminSettingsView theme={theme} setTheme={setTheme} />;
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
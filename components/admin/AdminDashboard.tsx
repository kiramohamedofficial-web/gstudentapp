import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { User, ActivityLog, Grade, Theme, Teacher, Subscription } from '../../types';
import AdminLayout from '../layout/AdminLayout';
import SubscriptionManagementView from './FinancialView';
import StudentDetailView from './StudentDetailView';
import StudentManagementView from './StudentManagementView';
import { 
    getAllUsers, 
    getActivityLogs, 
    getAllSubscriptions, 
    getAllGrades,
    getPendingSubscriptionRequestCount,
    getAllStudentProgress,
    getAllTeachers,
} from '../../services/storageService';
import { ChartBarIcon, UsersIcon, BellIcon, SearchIcon, InformationCircleIcon, UserCircleIcon, ChevronLeftIcon } from '../common/Icons';
import RevenueChart from './RevenueChart';
import QrCodeGeneratorView from './QrCodeGeneratorView';
import HomeManagementView from './HomeManagementView';
import PlatformSettingsView from './PlatformSettingsView';
import AdminSettingsView from './AdminSettingsView';
import TeacherManagementView from './TeacherManagementView';
import QuestionBankView from './QuestionBankView';
import SystemHealthView from './SystemHealthView';
import Loader from '../common/Loader';
import { useSession } from '../../hooks/useSession';

const SubscriptionPriceControlView = lazy(() => import('./SubscriptionPriceControlView'));
const CourseManagementView = lazy(() => import('./CourseManagementView'));
const ContentManagementView = lazy(() => import('./ContentManagementView'));
const DeviceManagementView = lazy(() => import('./DeviceManagementView'));
const AccountCreationDiagnosticsView = lazy(() => import('./AccountCreationDiagnosticsView'));
const TeacherCreationDiagnosticsView = lazy(() => import('./TeacherCreationDiagnosticsView'));


interface AdminDashboardProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'courseManagement' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings' | 'systemHealth' | 'accountSettings' | 'teachers' | 'subscriptionPrices' | 'deviceManagement' | 'content' | 'accountCreationDiagnostics' | 'teacherCreationDiagnostics';

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

const MainDashboard: React.FC<{ onNavigate: (view: AdminView) => void }> = ({ onNavigate }) => {
    const [stats, setStats] = useState({ students: 0, teachers: 0, activeSubs: 0, pendingRequests: 0 });
    const [latestUsers, setLatestUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const usersPromise = getAllUsers();
            const teachersPromise = getAllTeachers();
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
  
  const [studentListData, setStudentListData] = useState<{users: User[], subscriptions: Subscription[], allProgress: any[]}>({users: [], subscriptions: [], allProgress: []});
  const [isStudentDataLoading, setIsStudentDataLoading] = useState(true);

  useEffect(() => {
    // Fetch student-related data once and store it at the dashboard level
    if (activeView === 'students' || activeView === 'dashboard') { // Fetch on initial load and when navigating to students
        const fetchData = async () => {
            setIsStudentDataLoading(true);
            const usersPromise = getAllUsers();
            const subsPromise = getAllSubscriptions();
            const progressPromise = getAllStudentProgress();
            const [users, subs, progressData] = await Promise.all([usersPromise, subsPromise, progressPromise]);

            setStudentListData({
                users: users.filter(u => u.role === 'student'), 
                subscriptions: subs,
                allProgress: progressData
            });
            setIsStudentDataLoading(false);
        };
        fetchData();
    }
  }, [activeView]);


  const handleViewStudentDetails = useCallback((student: User) => {
    setSelectedStudent(student);
  }, []);

  const handleBackToStudents = useCallback(() => {
    setSelectedStudent(null);
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
      case 'subscriptionPrices': return <Suspense fallback={suspenseLoader}><SubscriptionPriceControlView /></Suspense>;
      case 'students': return <StudentManagementView 
                                onViewDetails={handleViewStudentDetails}
                                initialData={studentListData}
                                isLoading={isStudentDataLoading}
                               />;
      case 'teachers': return <TeacherManagementView />;
      case 'homeManagement': return <HomeManagementView />;
      case 'courseManagement': return <Suspense fallback={suspenseLoader}><CourseManagementView /></Suspense>;
      case 'content': return <Suspense fallback={suspenseLoader}><ContentManagementView /></Suspense>;
      case 'tools': return <QrCodeGeneratorView />;
      case 'deviceManagement': return <Suspense fallback={suspenseLoader}><DeviceManagementView /></Suspense>;
      case 'questionBank': return <QuestionBankView />;
      case 'platformSettings': return <PlatformSettingsView user={user} />;
      case 'systemHealth': return <SystemHealthView onNavigate={setActiveView} />;
      case 'accountSettings': return <AdminSettingsView theme={theme} setTheme={setTheme} />;
      case 'accountCreationDiagnostics': return <Suspense fallback={suspenseLoader}><AccountCreationDiagnosticsView /></Suspense>;
      case 'teacherCreationDiagnostics': return <Suspense fallback={suspenseLoader}><TeacherCreationDiagnosticsView /></Suspense>;
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
import React, { useState, useMemo } from 'react';
import { User, ActivityLog, Grade } from '../../types';
import AdminLayout from '../layout/AdminLayout';
import SubscriptionManagementView from './FinancialView';
import StudentDetailView from './StudentDetailView';
import { 
    getAllUsers, 
    getActivityLogs, 
    getSubscriptionByUserId, 
    getAllSubscriptions, 
    getAllGrades,
    getPendingSubscriptionRequestCount,
    getPendingStudentQuestionCount,
    getUserProgress
} from '../../services/storageService';
import { ChartBarIcon, UsersIcon, BellIcon, SearchIcon, InformationCircleIcon, QuestionMarkCircleIcon } from '../common/Icons';
import RevenueChart from './RevenueChart';
import ContentManagementView from './ContentManagementView';
import QrCodeGeneratorView from './QrCodeGeneratorView';
import HomeManagementView from './HomeManagementView';
import QuestionBankView from './QuestionBankView';
import PlatformSettingsView from './PlatformSettingsView';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'content' | 'tools' | 'homeManagement' | 'questionBank' | 'platformSettings';

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<{ className?: string; }>; delay: number; onClick?: () => void; }> = ({ title, value, icon: Icon, delay, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] flex items-center space-x-4 space-x-reverse fade-in ${onClick ? 'transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-purple-400 cursor-pointer' : ''}`} 
        style={{animationDelay: `${delay}ms`}}
    >
        <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
            <Icon className="w-8 h-8 text-purple-500" />
        </div>
        <div>
            <h3 className="text-md font-medium text-[var(--text-secondary)]">{title}</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
        </div>
    </div>
);

const calculateStudentProgress = (user: User, allGrades: Grade[]): number => {
    const grade = allGrades.find(g => g.id === user.grade);
    if (!grade) return 0;
    
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    if (allLessons.length === 0) return 100; // If no lessons, consider it 100% complete

    const userProgress = getUserProgress(user.id);
    const completed = allLessons.filter(l => !!userProgress[l.id]).length;
    return Math.round((completed / allLessons.length) * 100);
};

const StudentManagementView: React.FC<{ onViewDetails: (user: User) => void }> = ({ onViewDetails }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');

    const allUsers = useMemo(() => getAllUsers().filter(u => u.role !== 'admin'), []);
    const allGrades = useMemo(() => getAllGrades(), []);

    const filteredUsers = useMemo(() => {
        return allUsers
            .map(user => ({
                ...user,
                progress: calculateStudentProgress(user, allGrades),
                subscription: getSubscriptionByUserId(user.id),
            }))
            .filter(user => {
                const query = searchQuery.toLowerCase();
                const searchMatch = user.name.toLowerCase().includes(query) || user.phone.includes(query);
                const gradeMatch = gradeFilter ? user.grade.toString() === gradeFilter : true;
                return searchMatch && gradeMatch;
            });
    }, [allUsers, allGrades, searchQuery, gradeFilter]);
    
    const uniqueGrades = useMemo(() => {
        const gradeSet = new Set<string>();
        allUsers.forEach(u => gradeSet.add(u.grade.toString()));
        return Array.from(gradeSet).sort((a,b) => parseInt(a) - parseInt(b)).map(g => ({
            id: g,
            name: allGrades.find(grade => grade.id === parseInt(g))?.name || `الصف ${g}`
        }));
    }, [allUsers, allGrades]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الطلاب</h1>
            
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl shadow-md border border-[var(--border-primary)] mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-2">
                        <input
                            type="text"
                            placeholder="ابحث بالاسم أو رقم الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 pr-10 pl-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <SearchIcon className="w-5 h-5 text-[var(--text-secondary)]" />
                        </div>
                    </div>
                    <div>
                        <select
                            value={gradeFilter}
                            onChange={(e) => setGradeFilter(e.target.value)}
                             className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-4 transition-colors focus:ring-2 focus:ring-purple-400"
                        >
                            <option value="">كل الصفوف</option>
                            {uniqueGrades.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
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
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-[var(--text-primary)]">{user.name}</p>
                                        <p className="text-sm text-[var(--text-secondary)]">{allGrades.find(g => g.id === user.grade)?.name}</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-[var(--text-secondary)]">التقدم</span>
                                        <span className="text-xs font-bold text-purple-600">{user.progress}%</span>
                                    </div>
                                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{width: `${user.progress}%`}}></div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 justify-between md:justify-end">
                                     <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${user.subscription && user.subscription.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.subscription && user.subscription.status === 'Active' ? 'اشتراك نشط' : 'غير نشط'}
                                    </span>
                                    <button onClick={() => onViewDetails(user)} className="py-2 px-4 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors whitespace-nowrap">
                                        عرض التفاصيل
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-12 bg-[var(--bg-secondary)] rounded-xl border border-dashed border-[var(--border-primary)]">
                        <p className="text-[var(--text-secondary)]">لم يتم العثور على طلاب مطابقين لمعايير البحث.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


const MainDashboard: React.FC<{ onNavigate: (view: AdminView) => void }> = ({ onNavigate }) => {
    const allUsers = useMemo(() => getAllUsers(), []);
    const users = useMemo(() => allUsers.filter(u => u.role !== 'admin'), [allUsers]);
    const latestUsers = useMemo(() => [...users].reverse().slice(0, 5), [users]);
    const subscriptions = useMemo(() => getAllSubscriptions(), []);
    const activityLogs = useMemo(() => getActivityLogs().slice(0, 5), []);
    const pendingRequestsCount = useMemo(() => getPendingSubscriptionRequestCount(), []);
    const pendingQuestionsCount = useMemo(() => getPendingStudentQuestionCount(), []);
    
    const activeSubscriptions = subscriptions.filter(s => s.status === 'Active').length;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">لوحة التحكم الرئيسية</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="إجمالي الطلاب" value={users.length.toString()} icon={UsersIcon} delay={100} onClick={() => onNavigate('students')} />
                <StatCard title="الاشتراكات النشطة" value={activeSubscriptions.toString()} icon={ChartBarIcon} delay={200} onClick={() => onNavigate('subscriptions')} />
                <div className="relative">
                     <StatCard title="طلبات اشتراك" value={pendingRequestsCount.toString()} icon={InformationCircleIcon} delay={300} onClick={() => onNavigate('subscriptions')} />
                     {pendingRequestsCount > 0 && <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-red-500"></span>}
                </div>
                <div className="relative">
                    <StatCard title="أسئلة جديدة" value={pendingQuestionsCount.toString()} icon={QuestionMarkCircleIcon} delay={400} onClick={() => onNavigate('questionBank')} />
                    {pendingQuestionsCount > 0 && <span className="absolute top-4 right-4 h-3 w-3 rounded-full bg-red-500"></span>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] fade-in" style={{animationDelay: '500ms'}}>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">نظرة عامة على الإيرادات</h2>
                    <RevenueChart />
                </div>
                <div className="space-y-6">
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] fade-in" style={{animationDelay: '600ms'}}>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><UsersIcon className="w-6 h-6 ml-2"/> أحدث الطلاب</h2>
                        <div className="space-y-3">
                            {latestUsers.map(user => (
                                <div key={user.id} className="flex items-center text-sm">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-md flex-shrink-0 ml-3">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{user.name}</p>
                                        <p className="text-xs text-[var(--text-secondary)]">{getAllGrades().find(g => g.id === user.grade)?.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] fade-in" style={{animationDelay: '700ms'}}>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center"><BellIcon className="w-6 h-6 ml-2"/> أحدث الأنشطة</h2>
                        <div className="space-y-4">
                            {activityLogs.map((log: ActivityLog) => (
                                <div key={log.id} className="flex items-start text-sm">
                                    <div className="ml-3">
                                        <p className="font-semibold text-[var(--text-primary)]">{log.action}</p>
                                        <p className="text-[var(--text-secondary)]">{log.details}</p>
                                    </div>
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
  const { user, onLogout } = props;
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  const handleViewStudentDetails = (student: User) => {
    setSelectedStudent(student);
    setActiveView('students'); // Keep the view logical
  };

  const handleBackToStudents = () => {
    setSelectedStudent(null);
    // No need to change activeView, it's already 'students'
  };

  const handleNavClick = (view: AdminView) => {
    setSelectedStudent(null);
    setActiveView(view);
  };

  const renderContent = () => {
    if (selectedStudent) {
      return <StudentDetailView user={selectedStudent} onBack={handleBackToStudents} />;
    }

    switch (activeView) {
      case 'subscriptions':
        return <SubscriptionManagementView />;
      case 'students':
        return <StudentManagementView onViewDetails={handleViewStudentDetails} />;
      case 'homeManagement':
        return <HomeManagementView />;
      case 'content':
        return <ContentManagementView />;
      case 'questionBank':
        return <QuestionBankView />;
      case 'tools':
        return <QrCodeGeneratorView />;
      case 'platformSettings':
        return <PlatformSettingsView user={user} />;
      case 'dashboard':
      default:
        return <MainDashboard onNavigate={setActiveView} />;
    }
  };

  return (
    <AdminLayout {...props} activeView={activeView} onNavClick={handleNavClick}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
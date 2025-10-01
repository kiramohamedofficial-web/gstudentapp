

import React, { useState, useMemo } from 'react';
import { User, Theme, ActivityLog } from '../../types';
import AdminLayout from '../layout/AdminLayout';
import SubscriptionManagementView from './FinancialView';
import StudentDetailView from './StudentDetailView';
import { getAllUsers, getActivityLogs, getSubscriptionByUserId, getAllSubscriptions } from '../../services/storageService';
import { ChartBarIcon, UsersIcon, CurrencyDollarIcon, BellIcon } from '../common/Icons';
import RevenueChart from './RevenueChart';
import ContentManagementView from './ContentManagementView';
import QrCodeGeneratorView from './QrCodeGeneratorView';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

type AdminView = 'dashboard' | 'students' | 'subscriptions' | 'content' | 'tools' | 'settings';

const StatCard: React.FC<{ title: string; value: string; icon: React.FC<{ className?: string; }>; delay: number; onClick?: () => void; }> = ({ title, value, icon: Icon, delay, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] flex items-center space-x-4 space-x-reverse fade-in ${onClick ? 'transition-transform duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer' : ''}`} 
        style={{animationDelay: `${delay}ms`}}
    >
        <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
            <Icon className="w-8 h-8 text-[var(--accent-primary)]" />
        </div>
        <div>
            <h3 className="text-md font-medium text-[var(--text-secondary)]">{title}</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
        </div>
    </div>
);

const StudentManagementView: React.FC<{ onViewDetails: (user: User) => void }> = ({ onViewDetails }) => {
  const users = useMemo(() => getAllUsers().filter(u => u.role !== 'admin'), []);
  return (
    <div>
        <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الطلاب</h1>
         
        {/* Desktop Table */}
        <div className="hidden md:block bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)] overflow-x-auto">
            <table className="w-full text-right text-sm text-[var(--text-secondary)]">
                <thead className="bg-[var(--bg-secondary)]">
                    <tr>
                        <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                        <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الصف الدراسي</th>
                        <th className="px-6 py-4 font-bold text-[var(--text-primary)]">حالة الاشتراك</th>
                        <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-primary)]">
                    {users.map(user => {
                        const sub = getSubscriptionByUserId(user.id);
                        return (
                             <tr key={user.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                                <td className="px-6 py-4 font-semibold">{user.name}</td>
                                <td className="px-6 py-4">{user.grade}</td>
                                <td className="px-6 py-4">
                                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sub && sub.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {sub && sub.status === 'Active' ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button onClick={() => onViewDetails(user)} className="text-sm font-semibold text-[var(--accent-primary)] hover:underline">عرض التفاصيل</button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-4">
            {users.map(user => {
                const sub = getSubscriptionByUserId(user.id);
                return (
                    <div key={user.id} className="bg-[var(--bg-primary)] p-4 rounded-xl shadow-lg border border-[var(--border-primary)]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-[var(--text-primary)]">{user.name}</p>
                                <p className="text-sm text-[var(--text-secondary)]">الصف: {user.grade}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sub && sub.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {sub && sub.status === 'Active' ? 'نشط' : 'غير نشط'}
                            </span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                            <button onClick={() => onViewDetails(user)} className="w-full text-center text-sm font-semibold text-[var(--accent-primary)] hover:underline">
                                عرض التفاصيل
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>

    </div>
  );
}


const MainDashboard: React.FC<{ onNavigate: (view: AdminView) => void }> = ({ onNavigate }) => {
    const users = useMemo(() => getAllUsers().filter(u => u.role !== 'admin'), []);
    const subscriptions = useMemo(() => getAllSubscriptions(), []);
    const activityLogs = useMemo(() => getActivityLogs().slice(0, 5), []);
    
    const activeSubscriptions = subscriptions.filter(s => s.status === 'Active').length;
    const totalRevenue = subscriptions.reduce((total, sub) => {
        if (sub.plan === 'Monthly') return total + 100;
        if (sub.plan === 'Quarterly') return total + 250;
        if (sub.plan === 'Annual') return total + 800;
        return total;
    }, 0);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">لوحة التحكم الرئيسية</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="إجمالي الطلاب" value={users.length.toString()} icon={UsersIcon} delay={100} onClick={() => onNavigate('students')} />
                <StatCard title="الاشتراكات النشطة" value={activeSubscriptions.toString()} icon={ChartBarIcon} delay={200} />
                <StatCard title="إجمالي الإيرادات" value={`${totalRevenue} ج.م`} icon={CurrencyDollarIcon} delay={300} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] fade-in" style={{animationDelay: '400ms'}}>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">نظرة عامة على الإيرادات</h2>
                    <RevenueChart />
                </div>
                <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] fade-in" style={{animationDelay: '500ms'}}>
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
    );
}

const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
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
      case 'content':
        return <ContentManagementView />;
      case 'tools':
        return <QrCodeGeneratorView />;
      case 'settings':
        return <div className="text-[var(--text-primary)]">الإعدادات (قيد الإنشاء)</div>;
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

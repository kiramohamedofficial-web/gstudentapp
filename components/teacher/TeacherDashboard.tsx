import React, { useState, useMemo } from 'react';
import { User, Theme, TeacherView, Teacher } from '../../types';
import { getTeacherById, getSubscriptionsByTeacherId, getAllGrades } from '../../services/storageService';
import TeacherLayout from './TeacherLayout';
import TeacherContentManagement from './TeacherContentManagement';
import TeacherSubscriptionsView from './TeacherSubscriptionsView';
import TeacherProfileView from './TeacherProfileView';
import { CollectionIcon, UsersIcon } from '../common/Icons';
import QuestionBankView from '../admin/QuestionBankView';

interface TeacherDashboardProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<any> }> = ({ title, value, icon: Icon }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-lg border border-[var(--border-primary)] flex items-center space-x-4 space-x-reverse">
        <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
            <Icon className="w-8 h-8 text-purple-400" />
        </div>
        <div>
            <h3 className="text-md font-medium text-[var(--text-secondary)]">{title}</h3>
            <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
        </div>
    </div>
);


const MainDashboard: React.FC<{ teacher: Teacher }> = ({ teacher }) => {
    const totalUnits = useMemo(() => {
        const allGrades = getAllGrades();
        return allGrades.flatMap(g => g.semesters.flatMap(s => s.units)).filter(u => u.teacherId === teacher.id).length;
    }, [teacher.id]);

    const totalStudents = useMemo(() => getSubscriptionsByTeacherId(teacher.id).length, [teacher.id]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">لوحة التحكم الرئيسية</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatCard title="إجمالي الوحدات" value={totalUnits} icon={CollectionIcon} />
                <StatCard title="إجمالي الطلاب المشتركين" value={totalStudents} icon={UsersIcon} />
            </div>
            {/* Additional dashboard widgets can be added here */}
        </div>
    );
};

const TeacherDashboard: React.FC<TeacherDashboardProps> = (props) => {
  const { user, onLogout, theme, setTheme } = props;
  const [activeView, setActiveView] = useState<TeacherView>('dashboard');
  
  const teacherProfile = useMemo(() => {
    if (user.teacherId) {
      return getTeacherById(user.teacherId);
    }
    return null;
  }, [user.teacherId]);

  const handleNavClick = (view: TeacherView) => {
    setActiveView(view);
  };

  const renderContent = () => {
      if (!teacherProfile) {
          return <div className="p-8 text-center text-red-500">خطأ: لم يتم العثور على ملف المدرس المرتبط بهذا الحساب.</div>;
      }

      switch (activeView) {
        case 'content':
            return <TeacherContentManagement teacher={teacherProfile} />;
        case 'subscriptions':
            return <TeacherSubscriptionsView teacher={teacherProfile} />;
        case 'profile':
            return <TeacherProfileView user={user} teacher={teacherProfile} onLogout={onLogout} />;
        case 'questionBank':
            return <QuestionBankView />;
        case 'dashboard':
        default:
            return <MainDashboard teacher={teacherProfile} />;
      }
  };

  if (!teacherProfile) {
      return (
           <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-900/50 text-white p-8">
               <h1 className="text-3xl font-bold">خطأ في الحساب</h1>
               <p className="mt-4">حساب المدرس هذا غير مكتمل. يرجى التواصل مع مسؤول المنصة.</p>
               <button onClick={onLogout} className="mt-8 px-6 py-2 bg-red-500 rounded-lg">تسجيل الخروج</button>
           </div>
      );
  }

  return (
    <TeacherLayout 
        user={user}
        teacher={teacherProfile}
        onLogout={onLogout}
        activeView={activeView} 
        onNavClick={handleNavClick} 
    >
      {renderContent()}
    </TeacherLayout>
  );
};

export default TeacherDashboard;
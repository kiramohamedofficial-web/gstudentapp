import React, { useState, useMemo, useEffect } from 'react';
import { User, Theme, TeacherView, Teacher, Grade, Role } from '../../types';
import { getTeacherById, getSubscriptionsByTeacherId, getAllGrades, supabase } from '../../services/storageService';
import TeacherLayout from './TeacherLayout';
import TeacherContentManagement from './TeacherContentManagement';
import TeacherSubscriptionsView from './TeacherSubscriptionsView';
import TeacherProfileView from './TeacherProfileView';
import { CollectionIcon, UsersIcon, InformationCircleIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import Loader from '../common/Loader';

interface TeacherDashboardProps {
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
    const [totalUnits, setTotalUnits] = useState(0);

    useEffect(() => {
        const fetchUnitCount = async () => {
            const allGrades = await getAllGrades();
            const count = allGrades.flatMap(g => g.semesters.flatMap(s => s.units)).filter(u => u.teacherId === teacher.id).length;
            setTotalUnits(count);
        };
        fetchUnitCount();
    }, [teacher.id]);

    const [totalStudents, setTotalStudents] = useState(0);

    useEffect(() => {
        const fetchStudentCount = async () => {
            if (teacher.id) {
                const subscriptions = await getSubscriptionsByTeacherId(teacher.id);
                setTotalStudents(subscriptions.length);
            }
        };
        fetchStudentCount();
    }, [teacher.id]);

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
  const { theme, setTheme } = props;
  const { currentUser: user, handleLogout: onLogout } = useSession();
  const [activeView, setActiveView] = useState<TeacherView>('dashboard');
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherProfile = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setTeacherProfile(null);
        
        const linkedIdOnProfile = user.teacherId;

        if (!linkedIdOnProfile) {
            setIsLoading(false);
            return;
        }

        let teacherRecordId: string | undefined = undefined;

        if (user.role === Role.SUPERVISOR) {
            // Supervisor logic: The ID on their profile is the *user ID* of the teacher.
            const { data: teacherUserProfile, error } = await supabase
                .from('profiles')
                .select('teacher_id')
                .eq('id', linkedIdOnProfile)
                .single();

            if (error) {
                console.error(`Supervisor is linked to user ${linkedIdOnProfile}, but fetching profile failed: ${error.message}`);
            } else if (teacherUserProfile && teacherUserProfile.teacher_id) {
                teacherRecordId = teacherUserProfile.teacher_id;
            }
        } else {
            // Teacher logic: The ID on their profile is their own teacher record ID.
            teacherRecordId = linkedIdOnProfile;
        }

        if (teacherRecordId) {
            const profile = await getTeacherById(teacherRecordId);
            setTeacherProfile(profile);
        }

        setIsLoading(false);
    };

    fetchTeacherProfile();
  }, [user]);


  const handleNavClick = (view: TeacherView) => {
    setActiveView(view);
  };

  if (!user) return null;

  const renderContent = () => {
      if (!teacherProfile) {
          // This is handled by the check below, after isLoading.
          return null;
      }

      switch (activeView) {
        case 'content':
            return <TeacherContentManagement teacher={teacherProfile} />;
        case 'subscriptions':
            return <TeacherSubscriptionsView teacher={teacherProfile} />;
        case 'profile':
            return <TeacherProfileView teacher={teacherProfile} />;
        case 'dashboard':
        default:
            return <MainDashboard teacher={teacherProfile} />;
      }
  };
  
  if (isLoading) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Loader />
            <p className="mt-4 text-lg text-[var(--text-secondary)]">جاري تحميل بيانات المدرس...</p>
        </div>
    );
  }

  if (!teacherProfile) {
      return (
           <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 text-center">
                <InformationCircleIcon className="mx-auto h-20 w-20 text-yellow-500" />
                <h1 className="text-3xl font-bold mt-6">الحساب غير مربوط</h1>
                <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-md">
                    للوصول إلى لوحة التحكم، يجب أن يكون حساب المشرف الخاص بك مربوطًا بملف مدرس. يرجى التواصل مع مسؤول المنصة لإتمام عملية الربط.
                </p>
                <button onClick={onLogout} className="mt-8 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">تسجيل الخروج</button>
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
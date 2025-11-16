import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { User, TeacherView, Teacher, Grade, Role } from '../../types';
import { getTeacherById, getSubscriptionsByTeacherId, getAllGrades, supabase } from '../../services/storageService';
import TeacherLayout from './TeacherLayout';
import { CollectionIcon, UsersIcon, InformationCircleIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import Loader from '../common/Loader';

const TeacherContentManagement = lazy(() => import('./TeacherContentManagement'));
const TeacherSubscriptionsView = lazy(() => import('./TeacherSubscriptionsView'));
const TeacherProfileView = lazy(() => import('./TeacherProfileView'));
const SupervisorStudentManagementView = lazy(() => import('./SupervisorStudentManagementView'));
const SupervisorStudentDetailView = lazy(() => import('./SupervisorStudentDetailView'));
const StudentChatsView = lazy(() => import('./StudentChatsView'));
const TeacherStudentChatsView = lazy(() => import('./TeacherStudentChatsView'));


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

const TeacherDashboard: React.FC = () => {
  const { currentUser: user, handleLogout: onLogout } = useSession();
  const [activeView, setActiveView] = useState<TeacherView>('dashboard');
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
  const [supervisedTeachers, setSupervisedTeachers] = useState<Teacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setTeacherProfile(null);
        setSupervisedTeachers([]);
        setSelectedTeacherId(null);

        if (user.role === Role.SUPERVISOR) {
             const { data: links, error: linkError } = await supabase
                .from('supervisor_teachers')
                .select('teacher_id')
                .eq('supervisor_id', user.id);

            if (linkError || !links || links.length === 0) {
                console.error("Supervisor has no linked teachers or failed to fetch them.", linkError);
                setIsLoading(false);
                return;
            }

            const teacherIds = links.map(l => l.teacher_id);
            const profiles = await Promise.all(teacherIds.map(id => getTeacherById(id)));
            const validProfiles = profiles.filter((p): p is Teacher => p !== null);
            
            setSupervisedTeachers(validProfiles);
            if (validProfiles.length > 0) {
                setSelectedTeacherId(validProfiles[0].id);
            }
            setIsLoading(false);

        } else if (user.role === Role.TEACHER) {
            const teacherRecordId = user.teacherId;
            if (teacherRecordId) {
                const profile = await getTeacherById(teacherRecordId);
                setTeacherProfile(profile);
            }
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };

    fetchProfile();
}, [user]);

  const effectiveTeacherProfile = useMemo(() => {
    if (user?.role === Role.SUPERVISOR) {
        return supervisedTeachers.find(t => t.id === selectedTeacherId) || null;
    }
    return teacherProfile;
  }, [user?.role, selectedTeacherId, supervisedTeachers, teacherProfile]);

  const handleNavClick = (view: TeacherView) => {
    setViewingStudent(null);
    setActiveView(view);
  };

  const renderContent = () => {
    if (viewingStudent) {
        return (
            <Suspense fallback={<Loader />}>
                <SupervisorStudentDetailView user={viewingStudent} onBack={() => setViewingStudent(null)} />
            </Suspense>
        );
    }
    
    if (!effectiveTeacherProfile) {
          return null;
    }
      
      const isReadOnly = false; 

      switch (activeView) {
        case 'studentChats':
             if (user?.role === Role.SUPERVISOR) {
                return (
                    <Suspense fallback={<Loader />}>
                        <StudentChatsView supervisedTeachers={supervisedTeachers} supervisorId={user.id} />
                    </Suspense>
                );
            }
            if (user?.role === Role.TEACHER) {
                return (
                    <Suspense fallback={<Loader />}>
                        <TeacherStudentChatsView teacher={effectiveTeacherProfile} teacherId={user.id} />
                    </Suspense>
                );
            }
            return <MainDashboard teacher={effectiveTeacherProfile} />;
        case 'students':
            if (user?.role === Role.SUPERVISOR) {
                return (
                    <Suspense fallback={<Loader />}>
                        <SupervisorStudentManagementView supervisedTeachers={supervisedTeachers} onViewDetails={setViewingStudent} />
                    </Suspense>
                );
            }
            return <MainDashboard teacher={effectiveTeacherProfile} />;
        case 'content':
            return <Suspense fallback={<Loader />}><TeacherContentManagement teacher={effectiveTeacherProfile} isReadOnly={isReadOnly} /></Suspense>;
        case 'subscriptions':
            return <Suspense fallback={<Loader />}><TeacherSubscriptionsView teacher={effectiveTeacherProfile} /></Suspense>;
        case 'profile':
            return <Suspense fallback={<Loader />}><TeacherProfileView teacher={effectiveTeacherProfile} /></Suspense>;
        case 'dashboard':
        default:
            return <MainDashboard teacher={effectiveTeacherProfile} />;
      }
  };
  
  if (isLoading) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Loader />
            <p className="mt-4 text-lg text-[var(--text-secondary)]">جاري تحميل البيانات...</p>
        </div>
    );
  }

  if (!user || !effectiveTeacherProfile) {
      return (
           <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] p-8 text-center">
                <InformationCircleIcon className="mx-auto h-20 w-20 text-yellow-500" />
                <h1 className="text-3xl font-bold mt-6">الحساب غير مربوط</h1>
                <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-md">
                    للوصول إلى لوحة التحكم، يجب أن يكون حسابك مربوطًا بملف مدرس. يرجى التواصل مع مسؤول المنصة لإتمام عملية الربط.
                </p>
                <button onClick={onLogout} className="mt-8 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors">تسجيل الخروج</button>
           </div>
      );
  }

  return (
    <TeacherLayout 
        user={user}
        teacher={effectiveTeacherProfile}
        onLogout={onLogout}
        activeView={activeView} 
        onNavClick={handleNavClick} 
        supervisedTeachers={supervisedTeachers}
        selectedTeacherId={selectedTeacherId}
        onSelectTeacher={setSelectedTeacherId}
    >
      {renderContent()}
    </TeacherLayout>
  );
};

export default TeacherDashboard;
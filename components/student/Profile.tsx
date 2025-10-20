import React, { useMemo, useState } from 'react';
import { User, ToastType } from '../../types';
import { getGradeById, getSubscriptionByUserId, getUserProgress } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon, CreditCardIcon, KeyIcon, LogoutIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const StatCard: React.FC<{ icon: React.FC<{ className?: string; }>; title: string; value: string | React.ReactNode; delay: number }> = ({ icon: Icon, title, value, delay }) => (
  <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg flex items-center space-x-4 space-x-reverse border border-[var(--border-primary)] fade-in" style={{animationDelay: `${delay}ms`}}>
    <Icon className="w-8 h-8 text-[var(--accent-primary)]" />
    <div>
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
      <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  </div>
);

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const strokeWidth = 12;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-48 h-48">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <circle
          className="text-[var(--border-primary)]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
        <circle
          className="text-[var(--accent-primary)] transition-all duration-1000"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
          transform="rotate(-90 100 100)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-[var(--text-primary)]">{progress}%</span>
        <span className="text-sm text-[var(--text-secondary)]">مكتمل</span>
      </div>
    </div>
  );
};

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();

  const { totalLessons, completedLessons, progress } = useMemo(() => {
    if (!grade) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    const total = allLessons.length;
    const userProgress = getUserProgress(user.id);
    const completed = allLessons.filter(l => !!userProgress[l.id]).length;
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalLessons: total, completedLessons: completed, progress: prog };
  }, [grade, user.id]);
  
  const handleChangeCode = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // NOTE: This is a UI-only demonstration. In a real app, you would
      // call a service to update the user's code.
      addToast("تم تغيير كلمة المرور بنجاح (محاكاة).", ToastType.SUCCESS);
      setIsModalOpen(false);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">ملفي الشخصي والإعدادات</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Right Side */}
                <div className="flex flex-col items-center flex-shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-green-400 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-lg">
                    {user.name.charAt(0)}
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h2>
                    <p className="text-[var(--text-secondary)]">{grade?.name || 'غير محدد'}</p>
                </div>
                
                {/* Left Side */}
                <div className="w-full flex flex-col items-center md:items-start">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6 text-center md:text-right w-full">ملخص التقدم</h3>
                    <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
                        <CircularProgress progress={progress} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            <StatCard icon={CheckCircleIcon} title="الدروس المكتملة" value={completedLessons.toString()} delay={100}/>
                            <StatCard icon={ClockIcon} title="الدروس المتبقية" value={(totalLessons - completedLessons).toString()} delay={200}/>
                            <StatCard 
                            icon={CreditCardIcon} 
                            title="حالة الاشتراك" 
                            value={
                                <span className={`px-2 py-1 text-xs rounded-full ${subscription?.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {subscription?.status === 'Active' ? 'نشط' : 'غير نشط'}
                                </span>
                            }
                            delay={300}
                            />
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">إجراءات الحساب</h2>
                <div className="space-y-3">
                    <button onClick={() => setIsModalOpen(true)} className="w-full flex items-center justify-center p-3 rounded-lg text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] transition-colors duration-200 space-x-3 space-x-reverse">
                        <KeyIcon className="w-5 h-5" />
                        <span>تغيير كلمة المرور</span>
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors duration-200 space-x-3 space-x-reverse">
                        <LogoutIcon className="w-5 h-5" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تغيير كلمة المرور">
          <form onSubmit={handleChangeCode} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور الحالية</label>
                  <input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور الجديدة</label>
                  <input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">تأكيد كلمة المرور الجديدة</label>
                  <input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="flex justify-end pt-4">
                  <button type="submit" className="px-5 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                      حفظ التغييرات
                  </button>
              </div>
          </form>
      </Modal>
    </div>
  );
};

export default Profile;

import React, { useMemo } from 'react';
import { User, Theme } from '../../types';
import { getGradeById, getSubscriptionByUserId } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon, CreditCardIcon } from '../common/Icons';
import { THEMES } from '../../constants';

interface ProfileProps {
  user: User;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onLogout: () => void;
}

const StatCard: React.FC<{ icon: React.FC<{ className?: string; }>; title: string; value: string | React.ReactNode; delay: number }> = ({ icon: Icon, title, value, delay }) => (
  <div className="bg-[var(--bg-secondary)] p-4 rounded-lg flex items-center space-x-4 space-x-reverse border border-[var(--border-primary)] fade-in" style={{animationDelay: `${delay}ms`}}>
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
          className="text-[var(--bg-tertiary)]"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
        <circle
          className="text-[var(--accent-primary)] progress-circle-bar"
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
      <div className="absolute inset-0 flex flex-col items-center justify-center progress-circle-text">
        <span className="text-4xl font-bold text-[var(--text-primary)]">{progress}%</span>
        <span className="text-sm text-[var(--text-secondary)]">مكتمل</span>
      </div>
    </div>
  );
};

const Profile: React.FC<ProfileProps> = ({ user, theme, setTheme, onLogout }) => {
  const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);

  const { totalLessons, completedLessons, progress } = useMemo(() => {
    if (!grade) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    const total = allLessons.length;
    const completed = allLessons.filter(l => l.isCompleted).length;
    const prog = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalLessons: total, completedLessons: completed, progress: prog };
  }, [grade]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">ملفي الشخصي والإعدادات</h1>
      <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] mb-8">
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
                    <StatCard icon={CheckCircleIcon} title="الدروس المكتملة" value={completedLessons} delay={100}/>
                    <StatCard icon={ClockIcon} title="الدروس المتبقية" value={totalLessons - completedLessons} delay={200}/>
                    <StatCard 
                      icon={CreditCardIcon} 
                      title="حالة الاشتراك" 
                      value={
                        <span className={`px-2 py-1 text-xs rounded-full ${subscription?.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
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
      <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">إعدادات الحساب</h2>
        
        <div className="mb-6">
            <label className="block text-md font-medium text-[var(--text-secondary)] mb-3">تغيير السمة</label>
            <div className="flex flex-wrap gap-4">
                {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} title={t.name} className={`w-24 h-16 rounded-lg flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105 ${theme === t.id ? 'ring-2 ring-[var(--accent-primary)]' : 'ring-1 ring-inset ring-[var(--border-primary)]'}`}>
                      {t.id === 'dark' && <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center text-white"><span>{t.name}</span></div>}
                      {t.id === 'light' && <div className="w-full h-full rounded-md bg-gray-100 flex items-center justify-center text-black"><span>{t.name}</span></div>}
                      {t.id === 'gold' && <div className="w-full h-full rounded-md bg-yellow-100 flex items-center justify-center text-yellow-900"><span>{t.name}</span></div>}
                      {t.id === 'pink' && <div className="w-full h-full rounded-md bg-pink-100 flex items-center justify-center text-pink-900"><span>{t.name}</span></div>}
                    </button>
                ))}
            </div>
        </div>

        <div className="border-t border-[var(--border-primary)] my-6"></div>

        <div>
            <button
                onClick={onLogout}
                className="w-full md:w-auto px-6 py-3 text-sm font-bold text-white bg-red-600/90 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
                تسجيل الخروج
            </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

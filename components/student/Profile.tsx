import React, { useMemo, useState } from 'react';
import { User, ToastType, Theme } from '../../types';
import { getGradeById, getSubscriptionByUserId, getUserProgress, deleteSelf } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon, CreditCardIcon, KeyIcon, LogoutIcon, SparklesIcon, TemplateIcon, TrashIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';
import ThemeSelectionModal from '../common/ThemeSelectionModal';

interface ProfileProps {
  user: User;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const StatCard: React.FC<{ icon: React.FC<{ className?: string; }>; title: string; value: string | React.ReactNode; delay: number }> = ({ icon: Icon, title, value, delay }) => (
  <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl flex items-center space-x-4 space-x-reverse border border-[var(--border-primary)] fade-in" style={{animationDelay: `${delay}ms`}}>
    <div className="p-3 bg-[rgba(var(--accent-primary-rgb),0.1)] rounded-lg">
        <Icon className="w-6 h-6 text-[var(--accent-primary)]" />
    </div>
    <div>
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
      <div className="text-lg font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  </div>
);

const CircularProgress: React.FC<{ progress: number }> = ({ progress }) => {
  const strokeWidth = 12;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-44 h-44">
      <svg className="w-full h-full" viewBox="0 0 164 164">
        <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-secondary)" />
                <stop offset="100%" stopColor="var(--accent-primary)" />
            </linearGradient>
        </defs>
        <circle className="text-[var(--bg-tertiary)]" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx="82" cy="82" />
        <circle
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="82"
          cy="82"
          transform="rotate(-90 82 82)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center fade-in" style={{animationDelay: '300ms'}}>
        <span className="text-5xl font-bold text-[var(--text-primary)]">{progress}%</span>
        <span className="text-sm text-[var(--text-secondary)] mt-1">مكتمل</span>
      </div>
    </div>
  );
};

const getEvaluation = (progress: number) => {
    if (progress >= 90) {
        return { level: 'ممتاز', description: 'أداء استثنائي! استمر في هذا التفوق.', color: 'text-cyan-400', Icon: SparklesIcon };
    }
    if (progress >= 75) {
        return { level: 'متفوق', description: 'مجهود رائع ومستوى متقدم. أنت في الطليعة!', color: 'text-green-400', Icon: SparklesIcon };
    }
    if (progress >= 50) {
        return { level: 'مجتهد', description: 'عمل جيد ومثابرة واضحة. استمر في التقدم!', color: 'text-blue-400', Icon: CheckCircleIcon };
    }
    if (progress >= 25) {
        return { level: 'جيد', description: 'بداية جيدة، يمكنك تحقيق المزيد بالمواظبة.', color: 'text-yellow-400', Icon: CheckCircleIcon };
    }
    return { level: 'يحتاج لمجهود', description: 'لا تقلق، كل رحلة تبدأ بخطوة. ابدأ الآن!', color: 'text-red-400', Icon: ClockIcon };
};


const Profile: React.FC<ProfileProps> = ({ user, onLogout, theme, setTheme }) => {
  const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { addToast } = useToast();

  const { totalLessons, completedLessons, progress } = useMemo(() => {
    if (!grade) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const allLessons = grade.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
    const total = allLessons.length;
    if (total === 0) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const userProgress = getUserProgress(user.id);
    const completed = allLessons.filter(l => !!userProgress[l.id]).length;
    const prog = Math.round((completed / total) * 100);
    return { totalLessons: total, completedLessons: completed, progress: prog };
  }, [grade, user.id]);
  
  const evaluation = useMemo(() => getEvaluation(progress), [progress]);

  const handleChangeCode = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      addToast("تم تغيير كلمة المرور بنجاح (محاكاة).", ToastType.SUCCESS);
      setIsPasswordModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    const { error } = await deleteSelf();
    if (error) {
        addToast(`فشل حذف الحساب: ${error.message}`, ToastType.ERROR);
    } else {
        addToast('تم حذف حسابك بنجاح.', ToastType.SUCCESS);
        onLogout(); 
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">ملفي الشخصي والإعدادات</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="flex flex-col items-center flex-shrink-0">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-lg">
                    {user.name.charAt(0)}
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h2>
                    <p className="text-[var(--text-secondary)]">{grade?.name || 'غير محدد'}</p>
                </div>
                
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
                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${subscription?.status === 'Active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
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

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">تقييم الأداء</h3>
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-[rgba(var(--accent-primary-rgb),0.1)]`}>
                        <evaluation.Icon className={`w-10 h-10 ${evaluation.color}`} />
                    </div>
                    <div>
                        <p className={`text-xl font-bold ${evaluation.color}`}>{evaluation.level}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{evaluation.description}</p>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">البيانات الشخصية</h3>
                <ul className="space-y-3 text-sm">
                    <li className="flex justify-between items-center border-b border-[var(--border-primary)] pb-3">
                        <span className="font-semibold text-[var(--text-secondary)]">الاسم الكامل</span>
                        <span className="font-medium text-[var(--text-primary)]">{user.name}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-[var(--border-primary)] pb-3">
                        <span className="font-semibold text-[var(--text-secondary)]">الصف الدراسي</span>
                        <span className="font-medium text-[var(--text-primary)]">{grade?.name || 'غير محدد'}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-[var(--border-primary)] pb-3">
                        <span className="font-semibold text-[var(--text-secondary)]">البريد الإلكتروني</span>
                        <span className="font-medium text-[var(--text-primary)]">{user.email}</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-[var(--border-primary)] pb-3">
                        <span className="font-semibold text-[var(--text-secondary)]">رقم الهاتف</span>
                        <span className="font-medium text-[var(--text-primary)] text-left" dir="ltr">{user.phone}</span>
                    </li>
                    <li className="flex justify-between items-center">
                        <span className="font-semibold text-[var(--text-secondary)]">رقم ولي الأمر</span>
                        <span className="font-medium text-[var(--text-primary)] text-left" dir="ltr">{user.guardianPhone}</span>
                    </li>
                </ul>
            </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">إعدادات المظهر</h2>
                <button onClick={() => setIsThemeModalOpen(true)} className="w-full flex items-center justify-center p-3 rounded-lg text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors duration-200 space-x-3 space-x-reverse">
                    <TemplateIcon className="w-5 h-5 text-purple-400" />
                    <span>تغيير السمة</span>
                </button>
            </div>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">إجراءات الحساب</h2>
                <div className="space-y-3">
                    <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center justify-center p-3 rounded-lg text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] transition-colors duration-200 space-x-3 space-x-reverse">
                        <KeyIcon className="w-5 h-5" />
                        <span>تغيير كلمة المرور</span>
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="w-full flex items-center justify-center p-3 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors duration-200 space-x-3 space-x-reverse">
                        <TrashIcon className="w-5 h-5" />
                        <span>حذف الحساب</span>
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors duration-200 space-x-3 space-x-reverse">
                        <LogoutIcon className="w-5 h-5" />
                        <span>تسجيل الخروج</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="تغيير كلمة المرور">
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
      
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد حذف الحساب">
          <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد تمامًا؟ سيؤدي هذا إلى حذف حسابك وجميع بياناتك بشكل دائم، بما في ذلك تقدمك واشتراكاتك. لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
              <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، أحذف حسابي</button>
          </div>
      </Modal>

      <ThemeSelectionModal 
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        setTheme={setTheme}
      />
    </div>
  );
};

export default Profile;
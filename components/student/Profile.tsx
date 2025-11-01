import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { User, ToastType, Theme, Subscription, QuizAttempt, Grade as FullGrade, Teacher } from '../../types';
import { getStudentProgress, deleteSelf, getStudentQuizAttempts, getGradesForSelection, updateUser, getAllTeachers, getAllGrades } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon, CreditCardIcon, KeyIcon, LogoutIcon, SparklesIcon, TemplateIcon, TrashIcon, ArrowsExpandIcon, ArrowsShrinkIcon, VideoCameraIcon, GraduationCapIcon, BookOpenIcon, PencilIcon, PhoneIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';
import ThemeSelectionModal from '../common/ThemeSelectionModal';
import { useSession } from '../../hooks/useSession';
import { useSubscription } from '../../hooks/useSubscription';
import Loader from '../common/Loader';

interface ProfileProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDataSaverEnabled: boolean;
  onDataSaverToggle: (enabled: boolean) => void;
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
        <span className="text-5xl font-bold text-[var(--text-primary)]">{Math.round(progress)}%</span>
        <span className="text-sm text-[var(--text-secondary)] mt-1">مكتمل</span>
      </div>
    </div>
  );
};

const getEvaluation = (progress: number) => {
    if (progress >= 90) return { level: 'ممتاز', description: 'أداء استثنائي! استمر في هذا التفوق.', color: 'text-cyan-400', Icon: SparklesIcon };
    if (progress >= 75) return { level: 'متفوق', description: 'مجهود رائع ومستوى متقدم. أنت في الطليعة!', color: 'text-green-400', Icon: SparklesIcon };
    if (progress >= 50) return { level: 'مجتهد', description: 'عمل جيد ومثابرة واضحة. استمر في التقدم!', color: 'text-blue-400', Icon: CheckCircleIcon };
    if (progress >= 25) return { level: 'جيد', description: 'بداية جيدة، يمكنك تحقيق المزيد بالمواظبة.', color: 'text-yellow-400', Icon: CheckCircleIcon };
    return { level: 'يحتاج لمجهود', description: 'لا تقلق، كل رحلة تبدأ بخطوة. ابدأ الآن!', color: 'text-red-400', Icon: ClockIcon };
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button type="button" onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${enabled ? 'bg-purple-600' : 'bg-[var(--bg-tertiary)]'}`} role="switch" aria-checked={enabled}>
        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}/>
    </button>
);

const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onSave: (updates: Partial<User>) => Promise<void>; }> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        guardianPhone: '',
        grade: null as number | null,
    });
    const [grades, setGrades] = useState<{ id: number; name: string; level: 'Middle' | 'Secondary'; levelAr: 'الإعدادي' | 'الثانوي' }[]>([]);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: user.name || '',
                phone: user.phone ? user.phone.replace('+20', '') : '',
                guardianPhone: user.guardianPhone ? user.guardianPhone.replace('+20', '') : '',
                grade: user.grade,
            });
            setGrades(getGradesForSelection());
        }
    }, [user, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'phone' || name === 'guardianPhone') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            phone: formData.phone,
            guardianPhone: formData.guardianPhone,
            grade: formData.grade ? Number(formData.grade) : null,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تعديل البيانات الشخصية">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الاسم الكامل</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">رقم الهاتف</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required maxLength={11} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">رقم ولي الأمر</label>
                    <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required maxLength={11} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الصف الدراسي</label>
                    <select name="grade" value={String(formData.grade || '')} onChange={handleChange} className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                        <option value="">-- غير محدد --</option>
                        {grades.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
                    </select>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-5 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">حفظ التغييرات</button>
                </div>
            </form>
        </Modal>
    );
};


const Profile: React.FC<ProfileProps> = ({ theme, setTheme, isDataSaverEnabled, onDataSaverToggle }) => {
  const { currentUser: user, handleLogout: onLogout } = useSession();
  const { subscription, activeSubscriptions, isComprehensive } = useSubscription();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingSubsDetails, setIsLoadingSubsDetails] = useState(true);

  const grade = useMemo(() => user?.gradeData ?? null, [user]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const { addToast } = useToast();
  const [userProgress, setUserProgress] = useState<Record<string, boolean>>({});
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);


  useEffect(() => {
    if (!user) return;
    const fetchProgress = async () => {
        const [progressData, attemptsData, teachersData] = await Promise.all([
            getStudentProgress(user.id),
            getStudentQuizAttempts(user.id),
            getAllTeachers()
        ]);
        if (progressData) {
            const progressMap = progressData.reduce((acc, item) => {
                acc[item.lesson_id] = true;
                return acc;
            }, {} as Record<string, boolean>);
            setUserProgress(progressMap);
        }
        setQuizAttempts(attemptsData);
        setTeachers(teachersData);
        setIsLoadingSubsDetails(false);
    };
    fetchProgress();
  }, [user]);

  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.name])), [teachers]);

  const subscriptionDetails = useMemo(() => {
    if (activeSubscriptions.length === 0) return null;

    if (isComprehensive) {
        const compSub = activeSubscriptions.find(s => !s.teacherId);
        return {
            type: 'شامل',
            endDate: compSub?.endDate,
            items: []
        };
    }
    
    const teacherIds = [...new Set(activeSubscriptions.map(s => s.teacherId).filter(Boolean))];
    const items = teacherIds.map(id => ({
        teacher: teacherMap.get(id) || 'مدرس غير معروف',
        endDate: activeSubscriptions
            .filter(s => s.teacherId === id)
            .reduce((latest, sub) => new Date(sub.endDate) > new Date(latest) ? sub.endDate : latest, '1970-01-01')
    }));

    const latestEndDate = items.reduce((latest, item) => new Date(item.endDate) > new Date(latest) ? item.endDate : latest, '1970-01-01');

    return {
        type: 'محدود',
        endDate: latestEndDate,
        items: items
    };
  }, [activeSubscriptions, isComprehensive, teacherMap]);

  const handleFullscreenChange = useCallback(() => setIsFullscreen(!!document.fullscreenElement), []);

  useEffect(() => {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleFullscreenChange]);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
      } else if (document.exitFullscreen) {
          document.exitFullscreen();
      }
  };

  const { totalLessons, completedLessons, progress } = useMemo(() => {
    if (!grade || !user) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const allLessons = (grade.semesters || []).flatMap(s => (s.units || []).filter(unit => {
        if (!unit.track || unit.track === 'All') return true;
        if (user.track === 'Scientific' && (unit.track === 'Scientific' || unit.track === 'Science' || unit.track === 'Math')) return true;
        return unit.track === user.track;
    })).flatMap(u => (u.lessons || []));
    const total = allLessons.length;
    if (total === 0) return { totalLessons: 0, completedLessons: 0, progress: 0 };
    const completed = allLessons.filter(l => !!userProgress[l.id]).length;
    return { totalLessons: total, completedLessons: completed, progress: (completed / total) * 100 };
  }, [grade, user, userProgress]);
  
    const { quizzesPassed, totalTimeSpent } = useMemo(() => {
        if (!quizAttempts) return { quizzesPassed: 0, totalTimeSpent: 0 };
        const passed = quizAttempts.filter(a => a.isPass).length;
        const time = quizAttempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
        return { quizzesPassed: passed, totalTimeSpent: time };
    }, [quizAttempts]);

    const formatTime = (seconds: number) => {
        if (typeof seconds !== 'number' || isNaN(seconds)) {
            return '0 د';
        }
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h} س ${m} د`;
        return `${m} د`;
    };

  const evaluation = useMemo(() => getEvaluation(progress), [progress]);

  const handleChangeCode = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      addToast("تم تغيير كلمة المرور بنجاح (محاكاة).", ToastType.SUCCESS);
      setIsPasswordModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleteModalOpen(false);
    const { error } = await deleteSelf();
    if (error) { addToast(`فشل حذف الحساب: ${error.message}`, ToastType.ERROR); } 
    else {
        addToast('تم حذف حسابك بنجاح.', ToastType.SUCCESS);
        onLogout(); 
    }
  };
  
    const handleUpdateUser = async (updates: Partial<User>) => {
        if (!user) return;
        const formattedUpdates: Partial<User> = { ...updates };
        if (updates.phone) formattedUpdates.phone = `+20${updates.phone.replace(/^0/, '')}`;
        if (updates.guardianPhone) formattedUpdates.guardianPhone = `+20${updates.guardianPhone.replace(/^0/, '')}`;

        const { error } = await updateUser(user.id, formattedUpdates);
        if (error) {
            addToast(`فشل تحديث البيانات: ${error.message}`, ToastType.ERROR);
        } else {
            addToast("تم تحديث بياناتك بنجاح!", ToastType.SUCCESS);
            setIsEditModalOpen(false);
            window.location.reload();
        }
    };

  if (!user) return null;

  const hasActiveSubscription = subscription?.status === 'Active' && new Date(subscription.endDate) >= new Date();

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
             <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] flex flex-col items-center text-center">
                 <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-5xl mb-4 shadow-lg">{user.name.charAt(0)}</div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h2>
                <p className="text-[var(--text-secondary)]">{grade?.name || 'غير محدد'}</p>
                 <span className={`mt-3 px-3 py-1 text-xs font-semibold rounded-full ${hasActiveSubscription ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{hasActiveSubscription ? 'اشتراك نشط' : 'غير نشط'}</span>
            </div>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)] flex flex-col items-center">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-6">ملخص التقدم</h3>
                <CircularProgress progress={progress} />
                 <div className={`mt-6 flex items-center gap-2 font-semibold ${evaluation.color}`}><evaluation.Icon className="w-5 h-5"/> {evaluation.level}</div>
                 <p className="text-sm text-[var(--text-secondary)] mt-1 text-center max-w-xs">{evaluation.description}</p>
            </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={CheckCircleIcon} title="الدروس المكتملة" value={completedLessons.toString()} delay={100}/>
                <StatCard icon={BookOpenIcon} title="اختبارات ناجحة" value={quizzesPassed.toString()} delay={200}/>
                <StatCard icon={ClockIcon} title="إجمالي وقت المذاكرة" value={formatTime(totalTimeSpent)} delay={300}/>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">اشتراكاتي الحالية</h3>
                {isLoadingSubsDetails ? <div className="flex justify-center items-center py-8"><Loader /></div> : (
                    subscriptionDetails ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-md">
                                <span className="font-semibold text-[var(--text-secondary)]">نوع الاشتراك:</span>
                                <span className={`font-bold px-3 py-1 rounded-full text-sm ${isComprehensive ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {subscriptionDetails.type === 'شامل' ? 'اشتراك شامل' : 'اشتراك مواد محددة'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-md">
                                <span className="font-semibold text-[var(--text-secondary)]">ينتهي في:</span>
                                <span className="font-medium text-[var(--text-primary)]">{new Date(subscriptionDetails.endDate!).toLocaleDateString('ar-EG')}</span>
                            </div>
                            {!isComprehensive && subscriptionDetails.items.length > 0 && (
                                <div className="pt-4 border-t border-[var(--border-primary)]">
                                    <h4 className="font-semibold text-[var(--text-secondary)] mb-2">مشترك مع المدرسين:</h4>
                                    <ul className="space-y-2 list-disc list-inside text-[var(--text-primary)] pr-4">
                                        {subscriptionDetails.items.map((item, index) => (
                                            <li key={index}>
                                                أ. {item.teacher}
                                                <span className="text-xs text-[var(--text-secondary)] mr-2">(ينتهي في {new Date(item.endDate).toLocaleDateString('ar-EG')})</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {isComprehensive && (
                                <p className="text-sm text-center pt-4 border-t border-[var(--border-primary)] text-[var(--text-secondary)]">
                                    لديك وصول كامل لجميع المواد والمدرسين في المنصة.
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-center text-[var(--text-secondary)] py-4">لا يوجد لديك اشتراكات نشطة حاليًا.</p>
                    )
                )}
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">البيانات الشخصية</h3>
                    <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary)] hover:underline"><PencilIcon className="w-4 h-4"/> تعديل</button>
                </div>
                <ul className="space-y-1 text-md">
                    <li className="flex justify-between items-center py-3 border-b border-[var(--border-primary)]">
                        <span className="font-semibold text-[var(--text-secondary)]">الاسم الكامل</span>
                        <span className="font-medium text-[var(--text-primary)]">{user.name || 'غير محدد'}</span>
                    </li>
                    <li className="flex justify-between items-center py-3 border-b border-[var(--border-primary)]">
                        <span className="font-semibold text-[var(--text-secondary)]">الصف الدراسي</span>
                        <span className="font-medium text-[var(--text-primary)]">{grade?.name || 'غير محدد'}</span>
                    </li>
                    <li className="flex justify-between items-center py-3 border-b border-[var(--border-primary)]">
                        <span className="font-semibold text-[var(--text-secondary)]">البريد الإلكتروني</span>
                        <span className="font-medium text-[var(--text-primary)]">{user.email || 'غير محدد'}</span>
                    </li>
                    <li className="flex justify-between items-center py-3 border-b border-[var(--border-primary)]">
                        <span className="font-semibold text-[var(--text-secondary)]">رقم الهاتف</span>
                        <span className="font-medium text-[var(--text-primary)] text-left" dir="ltr">{user.phone || 'غير محدد'}</span>
                    </li>
                    <li className="flex justify-between items-center py-3">
                        <span className="font-semibold text-[var(--text-secondary)]">رقم ولي الأمر</span>
                        <span className="font-medium text-[var(--text-primary)] text-left" dir="ltr">{user.guardianPhone || 'غير محدد'}</span>
                    </li>
                </ul>
            </div>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">إعدادات الحساب والتطبيق</h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                        <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2"><VideoCameraIcon className="w-5 h-5 text-purple-400"/> توفير البيانات</h3>
                        <ToggleSwitch enabled={isDataSaverEnabled} onChange={onDataSaverToggle} />
                    </div>
                    <button onClick={() => setIsThemeModalOpen(true)} className="w-full text-right flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors"><span className="font-semibold flex items-center gap-2"><TemplateIcon className="w-5 h-5 text-purple-400"/> تغيير السمة</span></button>
                    <button onClick={toggleFullscreen} className="w-full text-right flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors"><span className="font-semibold flex items-center gap-2">{isFullscreen ? <ArrowsShrinkIcon className="w-5 h-5"/> : <ArrowsExpandIcon className="w-5 h-5" />} {isFullscreen ? 'الخروج من وضع ملء الشاشة' : 'عرض ملء الشاشة'}</span></button>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="w-full text-right flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors"><span className="font-semibold flex items-center gap-2"><KeyIcon className="w-5 h-5"/> تغيير كلمة المرور</span></button>
                </div>
            </div>
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-red-500/20">
                <h3 className="text-xl font-semibold text-red-400 mb-4">منطقة الخطر</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={onLogout} className="flex-1 flex items-center justify-center p-3 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"><LogoutIcon className="w-5 h-5 ml-2"/>تسجيل الخروج</button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="flex-1 flex items-center justify-center p-3 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"><TrashIcon className="w-5 h-5 ml-2"/>حذف الحساب نهائيًا</button>
                </div>
            </div>
        </div>
      </div>

      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="تغيير كلمة المرور">
          <form onSubmit={handleChangeCode} className="space-y-4">
              <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور الحالية</label><input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"/></div>
              <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور الجديدة</label><input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"/></div>
              <div><label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">تأكيد كلمة المرور الجديدة</label><input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"/></div>
              <div className="flex justify-end pt-4"><button type="submit" className="px-5 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">حفظ التغييرات</button></div>
          </form>
      </Modal>
      
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد حذف الحساب">
          <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد تمامًا؟ سيؤدي هذا إلى حذف حسابك وجميع بياناتك بشكل دائم، بما في ذلك تقدمك واشتراكاتك. لا يمكن التراجع عن هذا الإجراء.</p>
          <div className="flex justify-end space-x-3 space-x-reverse">
              <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
              <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، أحذف حسابي</button>
          </div>
      </Modal>

      <ThemeSelectionModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} currentTheme={theme} setTheme={setTheme} />
      {user && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={handleUpdateUser} />}
    </div>
  );
};

export default Profile;
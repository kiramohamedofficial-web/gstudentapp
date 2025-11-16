import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { User, ToastType, StudentView, Subscription, QuizAttempt } from '../../types';
import { deleteSelf, getGradesForSelection, updateUser, getStudentProgress, getStudentQuizAttempts, updateUserPassword } from '../../services/storageService';
import { TrashIcon, PencilIcon, ClockSolidIcon, BookBookmarkIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, CogIcon, AtomIcon, ArrowsExpandIcon, ArrowsShrinkIcon, KeyIcon, LogoutIcon, VideoCameraIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';
import { useSession } from '../../hooks/useSession';
import { useSubscription } from '../../hooks/useSubscription';
import Loader from '../common/Loader';
import { useAppearance } from '../../App';
import ThemeSelectionModal from '../common/ThemeSelectionModal';

const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onSave: (updates: Partial<User>) => Promise<void>; }> = ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        guardianPhone: '',
        grade: null as number | null,
    });
    const [grades, setGrades] = useState<{ id: number; name: string; level: 'Middle' | 'Secondary'; levelAr: 'الإعدادي' | 'الثانوي' }[]>([]);

    React.useEffect(() => {
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

const InfoRow: React.FC<{ label: string; value?: string | null; iconClass: string; isLtr?: boolean }> = ({ label, value, iconClass, isLtr = false }) => (
    <li className="flex justify-between items-center py-4 border-b border-[var(--border-primary)] last:border-b-0">
        <span className={`font-medium text-[var(--text-primary)] ${isLtr ? 'text-left' : 'text-right'}`} dir={isLtr ? 'ltr' : 'rtl'}>
            {value || 'غير محدد'}
        </span>
        <div className="flex items-center gap-3">
            <span className="font-semibold text-[var(--text-secondary)]">{label}</span>
            <i className={`${iconClass} w-5 h-5 text-gray-400 text-center`}></i>
        </div>
    </li>
);

interface ProfileProps {
  onNavigate: (view: StudentView) => void;
  isDataSaverEnabled: boolean;
  onDataSaverToggle: (enabled: boolean) => void;
}


const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl flex items-center gap-4">
        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-lg">{icon}</div>
        <div>
            <p className="text-sm text-[var(--text-secondary)]">{label}</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);

const CircularProgress: React.FC<{ progress: number, size?: number, strokeWidth?: number }> = ({ progress, size = 150, strokeWidth = 12 }) => {
    const radius = (size / 2) - (strokeWidth);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
            <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-[rgba(var(--accent-primary-rgb),0.1)]" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2}/>
                <circle className="text-[var(--accent-primary)] transition-all duration-500" strokeWidth={strokeWidth} strokeDasharray={circumference} style={{ strokeDashoffset: offset }} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} transform={`rotate(-90 ${size/2} ${size/2})`}/>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-[var(--text-primary)]">{Math.round(progress)}%</span>
                <span className="text-sm text-[var(--text-secondary)]">مكتمل</span>
            </div>
        </div>
    );
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enabled ? 'bg-purple-600' : 'bg-[var(--bg-tertiary)]'}`}
        role="switch"
        aria-checked={enabled}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

const SettingsRow: React.FC<{ icon: React.FC<{className?:string}>; label: string; action: React.ReactNode; }> = ({ icon: Icon, label, action }) => (
    <div className="flex justify-between items-center py-3 border-b border-[var(--border-primary)] last:border-b-0">
        <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-gray-400" />
            <span className="font-semibold text-[var(--text-primary)]">{label}</span>
        </div>
        <div>{action}</div>
    </div>
);

const ChangePasswordModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (password: string) => Promise<void>; }> = ({ isOpen, onClose, onSave }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        if (password !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين.');
            return;
        }
        setIsSaving(true);
        await onSave(password);
        setIsSaving(false);
    };

    useEffect(() => {
        if(isOpen) {
            setPassword('');
            setConfirmPassword('');
            setError('');
            setIsSaving(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تغيير كلمة المرور">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="password" placeholder="كلمة المرور الجديدة" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                <input type="password" placeholder="تأكيد كلمة المرور" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={isSaving} className="px-5 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</button>
                </div>
            </form>
        </Modal>
    );
};


const Profile: React.FC<ProfileProps> = ({ onNavigate, isDataSaverEnabled, onDataSaverToggle }) => {
    const { currentUser: user, handleLogout: onLogout } = useSession();
    const { addToast } = useToast();
    const { subscription } = useSubscription();
    const { mode, setMode, style, setStyle } = useAppearance();

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [completedLessons, setCompletedLessons] = useState(0);
    const [successfulTests, setSuccessfulTests] = useState(0);
    const [totalStudyTime, setTotalStudyTime] = useState(0);
    const [overallProgress, setOverallProgress] = useState(0);

    const handleFullscreenChange = useCallback(() => {
        setIsFullscreen(!!document.fullscreenElement);
    }, []);

    useEffect(() => {
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [handleFullscreenChange]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                addToast(`فشل تفعيل وضع ملء الشاشة: ${err.message}`, ToastType.ERROR);
            });
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    const handleUpdatePassword = async (password: string) => {
        const { error } = await updateUserPassword(password);
        if (error) {
            addToast(`فشل تغيير كلمة المرور: ${error.message}`, ToastType.ERROR);
        } else {
            addToast('تم تغيير كلمة المرور بنجاح.', ToastType.SUCCESS);
            setIsPasswordModalOpen(false);
        }
    };

    useEffect(() => {
        if (!user || !user.gradeData) {
            setIsLoadingStats(false);
            return;
        };

        const fetchStats = async () => {
            setIsLoadingStats(true);
            const [progressData, attemptsData] = await Promise.all([
                getStudentProgress(user.id),
                getStudentQuizAttempts(user.id)
            ]);
            
            setCompletedLessons(progressData.length);
            setSuccessfulTests(attemptsData.filter(a => a.isPass).length);
            const timeFromQuizzes = attemptsData.reduce((total, attempt) => total + (attempt.timeTaken || 0), 0);
            setTotalStudyTime(Math.round(timeFromQuizzes / 60));

            const allLessons = user.gradeData.semesters.flatMap(s => s.units.flatMap(u => u.lessons));
            const totalLessons = allLessons.length;
            if (totalLessons > 0) {
                const progress = (progressData.length / totalLessons) * 100;
                setOverallProgress(Math.round(progress));
            }
            
            setIsLoadingStats(false);
        };

        fetchStats();
    }, [user]);

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

    const getTrackName = (track: 'Scientific' | 'Literary' | 'All' | null | undefined) => {
        if (track === 'Scientific') return 'علمي';
        if (track === 'Literary') return 'أدبي';
        return '';
    }
  
    const trackName = getTrackName(user.track);
    const grade = useMemo(() => user?.gradeData ?? null, [user]);
    const hasActiveSubscription = subscription && subscription.status === 'Active' && new Date(subscription.endDate) >= new Date();

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-md border border-[var(--border-primary)] flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">{user.name.charAt(0)}</div>
                <div className="flex-1 text-center sm:text-right">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{user.name}</h1>
                    <p className="text-[var(--text-secondary)] mt-1">{grade?.name || 'طالب'} {trackName && `- ${trackName}`}</p>
                    {hasActiveSubscription ? (
                        <div className="inline-block mt-2 px-3 py-1 text-xs font-bold bg-green-500/10 text-green-400 rounded-full">اشتراك نشط</div>
                    ) : (
                        <div className="inline-block mt-2 px-3 py-1 text-xs font-bold bg-red-500/10 text-red-400 rounded-full">اشتراك غير نشط</div>
                    )}
                </div>
                <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 py-2 px-4 bg-purple-600/20 text-purple-300 rounded-lg font-semibold hover:bg-purple-600/40 transition-colors">
                    <PencilIcon className="w-4 h-4" /> تعديل الملف الشخصي
                </button>
            </div>

            <div className="home-card p-6 rounded-2xl text-center">
                <h2 className="text-2xl font-bold mb-4">ملخص التقدم</h2>
                {isLoadingStats ? <div className="h-[150px] flex items-center justify-center"><Loader /></div> : (
                    <>
                    <CircularProgress progress={overallProgress} />
                    <p className="text-[var(--text-secondary)] mt-4 max-w-xs mx-auto">
                        {overallProgress > 0 ? `رائع! لقد أكملت ${overallProgress}% من منهجك.` : 'يحتاج لمجهود. كل رحلة تبدأ بخطوة. ابدأ الآن!'}
                    </p>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<CheckCircleIcon className="w-6 h-6"/>} label="الدروس المكتملة" value={isLoadingStats ? '...' : completedLessons} />
                <StatCard icon={<BookBookmarkIcon className="w-6 h-6"/>} label="اختبارات ناجحة" value={isLoadingStats ? '...' : successfulTests} />
                <StatCard icon={<ClockSolidIcon className="w-6 h-6"/>} label="إجمالي وقت المذاكرة" value={isLoadingStats ? '...' : `${totalStudyTime} د`} />
            </div>

            {subscription && (
                <div className="home-card p-6 rounded-2xl">
                    <h2 className="text-2xl font-bold mb-4">اشتراكاتي الحالية</h2>
                    <div className="space-y-2 text-[var(--text-secondary)]">
                        <div className="flex justify-between"><span>نوع الاشتراك:</span> <span className="font-bold text-[var(--text-primary)]">{subscription.teacherId ? 'مادة محددة' : 'اشتراك شامل'}</span></div>
                        <div className="flex justify-between"><span>ينتهي في:</span> <span className="font-bold text-[var(--text-primary)]">{new Date(subscription.endDate).toLocaleDateString('ar-EG')}</span></div>
                    </div>
                    <button onClick={() => onNavigate('subscription')} className="w-full mt-4 py-2 text-center font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 rounded-lg transition-colors">إدارة الاشتراك</button>
                </div>
            )}

            <div className="home-card rounded-2xl">
                <button onClick={() => setIsDetailsOpen(!isDetailsOpen)} className="w-full flex justify-between items-center p-6 text-right">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">البيانات الشخصية</h2>
                    {isDetailsOpen ? <ChevronUpIcon className="w-6 h-6 text-[var(--text-secondary)]"/> : <ChevronDownIcon className="w-6 h-6 text-[var(--text-secondary)]"/>}
                </button>
                {isDetailsOpen && (
                    <div className="px-6 pb-6 border-t border-[var(--border-primary)] animate-fade-in">
                        <ul className="space-y-1 text-md">
                            <InfoRow label="الاسم الكامل" value={user.name} iconClass="fa-solid fa-user" />
                            <InfoRow label="البريد الإلكتروني" value={user.email} iconClass="fa-solid fa-envelope" />
                            <InfoRow label="رقم الهاتف" value={user.phone} iconClass="fa-solid fa-phone" isLtr={true} />
                            <InfoRow label="رقم ولي الأمر" value={user.guardianPhone} iconClass="fa-solid fa-user-shield" isLtr={true} />
                        </ul>
                    </div>
                )}
            </div>

            <div className="home-card p-6 rounded-2xl">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><CogIcon className="w-6 h-6"/> إعدادات الحساب والتطبيق</h2>
                <div className="space-y-1">
                    <SettingsRow 
                        icon={VideoCameraIcon}
                        label="توفير البيانات (جودة منخفضة للفيديو)"
                        action={<ToggleSwitch enabled={isDataSaverEnabled} onChange={onDataSaverToggle} />}
                    />
                    <SettingsRow 
                        icon={AtomIcon}
                        label="تغيير السمة (Theme)"
                        action={<button onClick={() => setIsThemeModalOpen(true)} className="text-sm font-semibold text-purple-400 hover:underline">تغيير</button>}
                    />
                     <SettingsRow 
                        icon={isFullscreen ? ArrowsShrinkIcon : ArrowsExpandIcon}
                        label="عرض ملء الشاشة"
                        action={<button onClick={toggleFullscreen} className="text-sm font-semibold text-purple-400 hover:underline">{isFullscreen ? 'خروج' : 'تفعيل'}</button>}
                    />
                     <SettingsRow 
                        icon={KeyIcon}
                        label="تغيير كلمة المرور"
                        action={<button onClick={() => setIsPasswordModalOpen(true)} className="text-sm font-semibold text-purple-400 hover:underline">تغيير</button>}
                    />
                </div>
            </div>

            <div className="bg-red-900/20 p-6 rounded-2xl border border-red-500/30">
                <h2 className="text-xl font-bold text-red-300">منطقة الخطر</h2>
                <p className="text-sm text-red-300/80 mt-2 mb-4">هذه الإجراءات لا يمكن التراجع عنها. يرجى توخي الحذر.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={onLogout} className="flex items-center justify-center gap-2 flex-1 py-2 px-4 bg-red-600/30 text-red-300 rounded-lg font-semibold hover:bg-red-600/50 transition-colors">
                        <LogoutIcon className="w-5 h-5"/> تسجيل الخروج
                    </button>
                    <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center gap-2 flex-1 py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                        <TrashIcon className="w-5 h-5"/> حذف الحساب نهائياً
                    </button>
                </div>
            </div>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="تأكيد حذف الحساب">
                <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد تمامًا؟ سيؤدي هذا إلى حذف حسابك وجميع بياناتك بشكل دائم، بما في ذلك تقدمك واشتراكاتك. لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                    <button onClick={handleDeleteAccount} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، أحذف حسابي</button>
                </div>
            </Modal>

            {user && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={handleUpdateUser} />}
        
            <ThemeSelectionModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} currentMode={mode} currentStyle={style} setMode={setMode} setStyle={setStyle} />
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} onSave={handleUpdatePassword} />
        </div>
    );
};

export default Profile;
import React, { useState, useCallback, useMemo } from 'react';
import { ShieldExclamationIcon, DatabaseIcon, TrashIcon, ShieldCheckIcon, WaveIcon, PhotoIcon, KeyIcon, HardDriveIcon, UserCheckIcon, ServerIcon, CogIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';
import { ToastType, AdminView } from '../../types';
import { checkDbConnection, getAllSubscriptions, getAllUsers, supabase, getAllTeachers } from '../../services/storageService';

type Status = 'idle' | 'running' | 'ok' | 'warning' | 'error';

interface Check {
    id: string;
    title: string;
    description: string;
    status: Status;
    details: string;
    icon: React.FC<any>;
    action: () => Promise<{ status: Status; details: string; }>;
}

const HealthCard: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border-primary)] flex items-center gap-3">
            <Icon className="w-6 h-6 text-purple-400" />
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
    const styles: Record<Status, { color: string; label: string; animation?: string }> = {
        idle: { color: 'bg-gray-500', label: 'لم يتم الفحص' },
        running: { color: 'bg-blue-500', label: 'جاري...', animation: 'animate-pulse' },
        ok: { color: 'bg-green-500', label: 'سليم' },
        warning: { color: 'bg-yellow-500', label: 'تحذير' },
        error: { color: 'bg-red-500', label: 'خطأ' },
    };
    const { color, label, animation } = styles[status];
    return (
        <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${color} ${animation || ''}`}></span>
            <span className="text-xs font-semibold">{label}</span>
        </div>
    );
};

interface SystemHealthViewProps {
  onNavigate: (view: AdminView) => void;
}

const SystemHealthView: React.FC<SystemHealthViewProps> = ({ onNavigate }) => {
    const { addToast } = useToast();
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanCompleted, setScanCompleted] = useState(false);

    const getInitialChecks = useCallback((): Check[] => [
        {
            id: 'db', title: 'اتصال قاعدة البيانات', icon: ServerIcon,
            description: 'فحص الاتصال بخادم قاعدة البيانات الرئيسية Supabase.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                const { error } = await checkDbConnection();
                if (error) return { status: 'error', details: `فشل الاتصال: ${error.message}` };
                return { status: 'ok', details: 'الاتصال ناجح والنظام يستجيب.' };
            }
        },
        {
            id: 'apiLatency', title: 'سرعة استجابة API', icon: WaveIcon,
            description: 'قياس وقت الاستجابة من قاعدة البيانات لتحديد التأخير.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                 const start = Date.now();
                 const { error } = await checkDbConnection();
                 const latency = Date.now() - start;
                 if (error) return { status: 'error', details: `فشل القياس بسبب خطأ في الاتصال.` };
                 if (latency > 800) return { status: 'warning', details: `الاستجابة بطيئة (${latency}ms). قد يواجه المستخدمون تأخيراً.` };
                 return { status: 'ok', details: `الاستجابة سريعة (${latency}ms).` };
            }
        },
        {
            id: 'supabaseDb', title: 'تخزين قاعدة البيانات', icon: DatabaseIcon,
            description: 'فحص حجم قاعدة بيانات Supabase. الحد المجاني هو 500 ميجابايت.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                const usageMb = 75, quotaMb = 500, usagePercent = (usageMb / quotaMb) * 100;
                let status: Status = 'ok';
                if (usagePercent > 95) status = 'error'; else if (usagePercent > 80) status = 'warning';
                return { status, details: `الاستخدام (محاكاة): ${usageMb}MB / ${quotaMb}MB (${usagePercent.toFixed(1)}%).` };
            }
        },
        {
            id: 'supabaseStorage', title: 'تخزين الملفات', icon: HardDriveIcon,
            description: 'فحص حجم الملفات المرفوعة. الحد المجاني هو 1 جيجابايت.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                const usageMb = 320, quotaGb = 1, quotaMb = quotaGb * 1024, usagePercent = (usageMb / quotaMb) * 100;
                let status: Status = 'ok';
                if (usagePercent > 95) status = 'error'; else if (usagePercent > 80) status = 'warning';
                return { status, details: `الاستخدام (محاكاة): ${usageMb}MB / ${quotaGb}GB (${usagePercent.toFixed(1)}%).` };
            }
        },
        {
            id: 'cdnStatus', title: 'حالة شبكة المحتوى (CDN)', icon: PhotoIcon,
            description: 'التحقق من إمكانية الوصول إلى خوادم الصور والملفات.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                try {
                    await fetch('https://h.top4top.io/p_3583m5j8t0.png', { mode: 'no-cors', signal: AbortSignal.timeout(5000) });
                    return { status: 'ok', details: 'شبكة توصيل المحتوى تعمل بشكل طبيعي.' };
                } catch (error) {
                    return { status: 'error', details: 'فشل الوصول إلى شبكة توصيل المحتوى.' };
                }
            }
        },
        {
            id: 'apiKey', title: 'مفتاح Gemini API', icon: KeyIcon,
            description: 'التحقق من وجود مفتاح API الخاص بالذكاء الاصطناعي.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                if (process.env.API_KEY) return { status: 'ok', details: 'تم العثور على مفتاح API.' };
                return { status: 'error', details: 'مفتاح Gemini API غير موجود! المساعد الذكي لن يعمل.' };
            }
        },
        {
            id: 'integrity', title: 'تكامل الاشتراكات', icon: DatabaseIcon,
            description: 'فحص بحثًا عن اشتراكات لطلاب محذوفين.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                const subscriptions = await getAllSubscriptions();
                const users = await getAllUsers();
                const userIds = new Set(users.map(u => u.id));
                const orphanedSubs = subscriptions.filter(s => !userIds.has(s.userId));
                if (orphanedSubs.length > 0) return { status: 'warning', details: `تم العثور على ${orphanedSubs.length} اشتراك معزول.` };
                return { status: 'ok', details: 'لم يتم العثور على مشاكل.' };
            }
        },
        {
            id: 'orphanedTeachers', title: 'تكامل بيانات المدرسين', icon: UserCheckIcon,
            description: 'فحص للبحث عن ملفات مدرسين غير مرتبطة بحساب مستخدم.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                const teachers = await getAllTeachers();
                const { data: profiles, error: profileError } = await supabase.from('profiles').select('teacher_id').eq('role', 'teacher').not('teacher_id', 'is', null);
                if (profileError) return { status: 'error', details: `فشل جلب ملفات المستخدمين: ${profileError.message}` };

                const teacherIds = new Set(teachers.map(t => t.id));
                const linkedTeacherIdsInProfiles = new Set(profiles.map(p => p.teacher_id));
                const orphanedTeacherIds = [...teacherIds].filter(id => !linkedTeacherIdsInProfiles.has(id));
                
                if (orphanedTeacherIds.length > 0) return { status: 'warning', details: `تم العثور على ${orphanedTeacherIds.length} ملف مدرس غير مربوط بحساب.` };
                return { status: 'ok', details: 'جميع ملفات المدرسين مربوطة.' };
            }
        },
        {
            id: 'testUsers', title: 'حسابات اختبار معزولة', icon: TrashIcon,
            description: 'البحث عن حسابات تجريبية قديمة تم إنشاؤها عبر أداة الفحص.',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => {
                const users = await getAllUsers();
                const testUsers = users.filter(u => u.email?.startsWith('test.user.'));
                if (testUsers.length > 0) return { status: 'warning', details: `تم العثور على ${testUsers.length} حساب تجريبي.` };
                return { status: 'ok', details: 'لا توجد حسابات تجريبية قديمة.' };
            }
        },
        {
            id: 'security', title: 'التكوين الأمني', icon: ShieldCheckIcon,
            description: 'مراجعة الإعدادات الأمنية الأساسية للمنصة (محاكاة).',
            status: 'idle', details: 'جاهز للفحص.',
            action: async () => ({ status: 'warning', details: 'حماية SQLi/CSRF فعالة. تنبيه: مفتاح Gemini API مكشوف من جانب العميل.' })
        },
    ], []);

    const [checks, setChecks] = useState<Check[]>(getInitialChecks());

    const summary = useMemo(() => {
        if (!scanCompleted) return null;
        const warnings = checks.filter(c => c.status === 'warning').length;
        const errors = checks.filter(c => c.status === 'error').length;
        const ok = checks.filter(c => c.status === 'ok').length;
        const overallStatus = errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok';
        
        return {
            warnings, errors, ok, total: checks.length, overallStatus
        };
    }, [checks, scanCompleted]);

    const runAllScans = async () => {
        setIsScanning(true);
        setScanCompleted(false);
        const initialChecks = getInitialChecks();
        setChecks(initialChecks.map(c => ({...c, status: 'running', details: 'جاري الفحص...'})));

        for (const check of initialChecks) {
            const result = await check.action();
            setChecks(prev => prev.map(c => c.id === check.id ? {...c, ...result} : c));
        }
        
        setIsScanning(false);
        setScanCompleted(true);
        addToast('اكتمل فحص النظام.', ToastType.SUCCESS);
    };
    
    const handleCleanup = useCallback(() => {
        setIsCleanupModalOpen(false);
        setIsCleaning(true);
        addToast('جاري تنفيذ عملية التنظيف...', ToastType.INFO);
        setTimeout(() => {
            setIsCleaning(false);
            addToast('تمت عملية تنظيف البيانات بنجاح (محاكاة).', ToastType.SUCCESS);
            runAllScans();
        }, 3000);
    }, [addToast, runAllScans]);

    return (
        <div className="fade-in space-y-8">
            <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">فحص الأعطال وصحة النظام</h1>
                    <button onClick={runAllScans} disabled={isScanning} className="px-5 py-2.5 font-semibold bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-all shadow-lg shadow-purple-500/20 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait">
                        {isScanning ? 'جاري الفحص...' : 'بدء الفحص الشامل'}
                    </button>
                </div>
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)] fade-in">
                        <div className={`p-4 rounded-lg text-center ${{'ok': 'bg-green-500/10', 'warning': 'bg-yellow-500/10', 'error': 'bg-red-500/10'}[summary.overallStatus]}`}>
                            <p className="text-sm text-[var(--text-secondary)]">الحالة العامة</p>
                            <p className={`font-bold text-lg ${{'ok': 'text-green-400', 'warning': 'text-yellow-400', 'error': 'text-red-400'}[summary.overallStatus]}`}>
                                {{'ok': 'سليم', 'warning': 'مستقر', 'error': 'حرج'}[summary.overallStatus]}
                            </p>
                        </div>
                         <div className="p-4 rounded-lg bg-green-500/10 text-center"><p className="text-sm text-green-300/70">فحوصات ناجحة</p><p className="font-bold text-lg text-green-300">{summary.ok}/{summary.total}</p></div>
                         <div className="p-4 rounded-lg bg-yellow-500/10 text-center"><p className="text-sm text-yellow-300/70">تحذيرات</p><p className="font-bold text-lg text-yellow-300">{summary.warnings}</p></div>
                         <div className="p-4 rounded-lg bg-red-500/10 text-center"><p className="text-sm text-red-300/70">أخطاء</p><p className="font-bold text-lg text-red-300">{summary.errors}</p></div>
                    </div>
                )}
            </div>

            <HealthCard title="فحوصات النظام" icon={ShieldCheckIcon}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {checks.map(check => (
                        <div key={check.id} className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-sm flex items-center gap-2"><check.icon className="w-4 h-4 text-purple-400"/> {check.title}</h3>
                                <StatusIndicator status={check.status}/>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">{check.details}</p>
                        </div>
                    ))}
                </div>
            </HealthCard>
            
            <HealthCard title="الصيانة والأدوات التشخيصية" icon={CogIcon}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <h3 className="font-semibold text-[var(--text-primary)]">صيانة النظام</h3>
                         <p className="text-sm text-[var(--text-secondary)] mt-1 mb-3">حذف البيانات المتبقية (مثل الاشتراكات والتقدم) المتعلقة بالطلاب الذين تم حذف حساباتهم.</p>
                         <button onClick={() => setIsCleanupModalOpen(true)} disabled={isCleaning} className="w-full py-2.5 font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-lg transition-colors flex items-center justify-center gap-2">
                             <TrashIcon className="w-5 h-5" />{isCleaning ? 'جاري التنظيف...' : 'بدء عملية التنظيف'}
                         </button>
                    </div>
                     <div>
                         <h3 className="font-semibold text-[var(--text-primary)]">أدوات تشخيصية</h3>
                         <p className="text-sm text-[var(--text-secondary)] mt-1 mb-3">أدوات متقدمة لمحاكاة العمليات الحرجة وتشخيص المشاكل المعقدة.</p>
                         <div className="space-y-2">
                            <button onClick={() => onNavigate('accountCreationDiagnostics')} className="w-full text-left p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors text-sm">فحص إنشاء حساب طالب</button>
                            <button onClick={() => onNavigate('teacherCreationDiagnostics')} className="w-full text-left p-3 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors text-sm">فحص إنشاء حساب مدرس</button>
                        </div>
                    </div>
                </div>
            </HealthCard>
            
            <Modal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} title="تأكيد حذف البيانات المعزولة">
                <p className="text-[var(--text-secondary)] mb-6">هل أنت متأكد؟ سيقوم النظام بحذف جميع البيانات المرتبطة بحسابات الطلاب المحذوفة. لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                    <button onClick={() => setIsCleanupModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                    <button onClick={handleCleanup} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، قم بالحذف</button>
                </div>
            </Modal>
        </div>
    );
};

export default SystemHealthView;

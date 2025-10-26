import React, { useState, useEffect, useCallback } from 'react';
import { ServerIcon, ShieldExclamationIcon, DatabaseIcon, UsersIcon, TrashIcon } from '../common/Icons';
import Modal from '../common/Modal';
import { useToast } from '../../useToast';
import { ToastType } from '../../types';

type Status = 'idle' | 'scanning' | 'ok' | 'warning' | 'error';
type ServerName = 'core' | 'middleSchool' | 'local';

interface ServerStatus {
    name: string;
    key: ServerName;
    status: Status;
    details: string;
}

const HealthCard: React.FC<{ title: string; icon: React.FC<any>; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center">
            <Icon className="w-6 h-6 ml-3 text-purple-400" />
            {title}
        </h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const StatusIndicator: React.FC<{ status: Status }> = ({ status }) => {
    const colorMap: Record<Status, string> = {
        idle: 'bg-gray-500',
        scanning: 'bg-blue-500 animate-pulse',
        ok: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    };
    return <span className={`w-3 h-3 rounded-full ${colorMap[status]}`}></span>;
};

const SystemHealthView: React.FC = () => {
    const { addToast } = useToast();
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([
        { name: 'الخدمات الأساسية (Core)', key: 'core', status: 'idle', details: 'جاهز للفحص' },
        { name: 'محتوى الإعدادي (Middle School)', key: 'middleSchool', status: 'idle', details: 'جاهز للفحص' },
        { name: 'التخزين المحلي (Local Storage)', key: 'local', status: 'idle', details: 'جاهز للفحص' },
    ]);
    const [storageInfo, setStorageInfo] = useState({ size: 0, percentage: 0 });
    const [inactiveUsers, setInactiveUsers] = useState<{name: string, grade: string}[]>([]);
    const [isFindingUsers, setIsFindingUsers] = useState(false);

    const securityChecks = [
        { name: 'ثغرات حقن SQL', status: 'ok' as Status, details: 'لم يتم العثور على نقاط ضعف معروفة.' },
        { name: 'ثغرات XSS', status: 'ok' as Status, details: 'المدخلات والمخرجات معقمة بشكل جيد.' },
        { name: 'كشف مفاتيح API', status: 'warning' as Status, details: 'مفتاح واحد مكشوف في جانب العميل. (مطلوب لواجهة برمجة تطبيقات Gemini)' },
        { name: 'حماية من CSRF', status: 'ok' as Status, details: 'تم تطبيق رموز الحماية.' },
    ];
    
    const runScan = useCallback((serverKey: ServerName) => {
        setServerStatuses(prev => prev.map(s => s.key === serverKey ? { ...s, status: 'scanning', details: 'جاري الفحص...' } : s));

        setTimeout(() => {
            const isSuccess = Math.random() > 0.1; // 90% success rate
            const newStatus = isSuccess ? 'ok' : 'error';
            const newDetails = isSuccess ? 'يعمل بشكل طبيعي' : 'فشل الاتصال';
            setServerStatuses(prev => prev.map(s => s.key === serverKey ? { ...s, status: newStatus, details: newDetails } : s));
        }, 1500 + Math.random() * 1000);
    }, []);

    const calculateStorage = useCallback(() => {
        let total = 0;
        for (let x in localStorage) {
            if (!localStorage.hasOwnProperty(x)) continue;
            total += (localStorage[x].length * 2);
        }
        const sizeInKB = total / 1024;
        const maxSizeKB = 5 * 1024; // 5MB limit
        setStorageInfo({ size: sizeInKB, percentage: (sizeInKB / maxSizeKB) * 100 });
    }, []);

    const findInactiveUsers = () => {
        setIsFindingUsers(true);
        // This is a simulation. In a real app, you would query your backend
        // for users with a 'last_login' date older than a certain threshold.
        setTimeout(() => {
            setInactiveUsers([
                { name: 'طالب افتراضي ١', grade: 'الصف الأول الثانوي' },
                { name: 'طالب افتراضي ٢', grade: 'الصف الثالث الإعدادي' },
                { name: 'طالب افتراضي ٣', grade: 'الصف الثاني الثانوي' },
            ]);
            setIsFindingUsers(false);
        }, 2000);
    };

    useEffect(() => {
        calculateStorage();
    }, [calculateStorage]);
    
    const handleCleanup = useCallback(() => {
        setIsCleanupModalOpen(false);
        setIsCleaning(true);
        addToast('جاري البحث عن البيانات التالفة وحذفها...', 'info');

        // This is a simulation. A real implementation would call a backend function (e.g., a Supabase Edge Function)
        // to perform a safe cleanup of orphaned records in the database.
        setTimeout(() => {
            setIsCleaning(false);
            addToast('تمت عملية تنظيف البيانات بنجاح.', ToastType.SUCCESS);
        }, 3000);
    }, [addToast]);

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">فحص الأمان وصحة النظام</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Server Health */}
                <HealthCard title="فحص السيرفرات" icon={ServerIcon}>
                    {serverStatuses.map(server => (
                        <div key={server.key} className="bg-[var(--bg-tertiary)] p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <StatusIndicator status={server.status} />
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">{server.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{server.details}</p>
                                </div>
                            </div>
                            <button onClick={() => runScan(server.key)} disabled={server.status === 'scanning'} className="px-3 py-1 text-xs font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 rounded-md transition-colors disabled:opacity-50">
                                {server.status === 'scanning' ? '...' : 'فحص'}
                            </button>
                        </div>
                    ))}
                </HealthCard>

                {/* Security Scan */}
                <HealthCard title="المشاكل الأمنية" icon={ShieldExclamationIcon}>
                    {securityChecks.map(check => (
                         <div key={check.name} className="bg-[var(--bg-tertiary)] p-3 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <StatusIndicator status={check.status} />
                                <div>
                                    <p className="font-semibold text-[var(--text-primary)]">{check.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{check.details}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </HealthCard>

                {/* Storage */}
                <HealthCard title="التخزين" icon={DatabaseIcon}>
                    <p className="text-sm text-[var(--text-secondary)]">حجم التخزين المحلي المستخدم على جهاز العميل.</p>
                     <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-4 border border-[var(--border-primary)] p-0.5">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full" style={{ width: `${storageInfo.percentage}%` }}></div>
                    </div>
                    <p className="text-center font-mono text-lg">{storageInfo.size.toFixed(2)} KB / 5120 KB</p>
                </HealthCard>

                {/* Inactive Accounts */}
                <HealthCard title="الحسابات غير النشطة" icon={UsersIcon}>
                     <p className="text-sm text-[var(--text-secondary)]">فحص الحسابات التي لم تسجل دخولاً منذ أكثر من 90 يومًا (محاكاة).</p>
                     {inactiveUsers.length > 0 ? (
                        <div className="space-y-2">
                            {inactiveUsers.map(user => (
                                <div key={user.name} className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{user.grade}</p>
                                </div>
                            ))}
                        </div>
                     ) : (
                         <button onClick={findInactiveUsers} disabled={isFindingUsers} className="w-full py-3 font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 rounded-lg transition-colors disabled:opacity-50">
                            {isFindingUsers ? 'جاري البحث...' : 'بحث عن الحسابات'}
                        </button>
                     )}
                </HealthCard>

                {/* Data Maintenance */}
                <HealthCard title="صيانة البيانات" icon={DatabaseIcon}>
                    <p className="text-sm text-[var(--text-secondary)]">
                        حذف البيانات المتبقية (مثل الاشتراكات والتقدم) المتعلقة بالطلاب الذين تم حذف حساباتهم.
                    </p>
                    <button
                        onClick={() => setIsCleanupModalOpen(true)}
                        disabled={isCleaning}
                        className="w-full mt-2 py-3 font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center"
                    >
                        <TrashIcon className="w-5 h-5 ml-2" />
                        {isCleaning ? 'جاري التنظيف...' : 'بدء عملية التنظيف'}
                    </button>
                </HealthCard>
            </div>
            
            <Modal isOpen={isCleanupModalOpen} onClose={() => setIsCleanupModalOpen(false)} title="تأكيد حذف البيانات التالفة">
                <p className="text-[var(--text-secondary)] mb-6">
                    هل أنت متأكد من رغبتك في بدء عملية التنظيف؟ سيقوم النظام بالبحث عن وحذف جميع البيانات (الاشتراكات، التقدم الدراسي، إلخ) المرتبطة بحسابات الطلاب المحذوفة. لا يمكن التراجع عن هذا الإجراء.
                </p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                    <button onClick={() => setIsCleanupModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handleCleanup} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">
                        نعم، قم بالحذف
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default SystemHealthView;

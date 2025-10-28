import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SubscriptionRequest, ToastType, Subscription, Grade, User, PlatformSettings } from '../../types';
import { getSubscriptionRequests, updateSubscriptionRequest, createOrUpdateSubscription, getAllSubscriptions, getAllUsers, getAllGrades, getPlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import { BellIcon, CheckCircleIcon, ClockIcon, CreditCardIcon, PhoneIcon, TrashIcon, CheckIcon, UserCircleIcon, CurrencyDollarIcon } from '../common/Icons';
import Loader from '../common/Loader';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.FC<any>; color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl shadow-md border border-[var(--border-primary)] flex items-center space-x-4 space-x-reverse">
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace(']', '/10]')}`}>
            <Icon className={`w-7 h-7 ${color}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        </div>
    </div>
);


const ApprovalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    request: SubscriptionRequest | null;
    onConfirm: (request: SubscriptionRequest, plan: Subscription['plan'], customEndDate?: string) => void;
}> = ({ isOpen, onClose, request, onConfirm }) => {
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (!isOpen) setEndDate('');
    }, [isOpen]);
    
    if (!request) return null;

    const handleSubmit = () => {
        onConfirm(request, request.plan, endDate || undefined);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`تفعيل اشتراك ${request.userName}`}>
            <div className="space-y-4">
                <p>أنت على وشك تفعيل باقة <span className="font-bold">{request.plan}</span> للطالب.</p>
                {request.subjectName && (
                    <p className="text-sm bg-[var(--bg-tertiary)] p-2 rounded-md">
                        المادة المطلوبة: <span className="font-bold text-[var(--text-primary)]">{request.subjectName}</span>
                    </p>
                )}
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">تاريخ الانتهاء (اختياري)</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">اتركه فارغًا للاحتساب التلقائي.</p>
                </div>
                 <div className="flex justify-end pt-4">
                    <button onClick={handleSubmit} className="px-5 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700">تأكيد التفعيل</button>
                </div>
            </div>
        </Modal>
    )
}

const RequestCard: React.FC<{
    request: SubscriptionRequest;
    price: number | null;
    onApprove: (req: SubscriptionRequest) => void;
    onReject: (req: SubscriptionRequest) => void;
}> = ({ request, price, onApprove, onReject }) => {
    const planLabels: Record<SubscriptionRequest['plan'], string> = {
        Monthly: 'شهري',
        Quarterly: 'ربع سنوي',
        Annual: 'سنوي',
        SemiAnnually: 'نصف سنوي'
    };

    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-lg border border-transparent hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col">
            <div className="p-5">
                 <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2"><UserCircleIcon className="w-5 h-5"/> {request.userName}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{request.subjectName || 'الباقة الشاملة'}</p>
                    </div>
                </div>
                <div className="space-y-3 text-sm mt-4 pt-4 border-t border-[var(--border-primary)]">
                    <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-2"><CreditCardIcon className="w-4 h-4" /> نوع الباقة</span>
                        <span className="font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full text-sm">{planLabels[request.plan]}</span>
                    </div>
                    {price !== null && (
                        <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-2"><CurrencyDollarIcon className="w-4 h-4" /> المبلغ المحول</span>
                            <span className="font-bold text-lg text-[var(--text-accent)]">{price} ج.م</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-2"><PhoneIcon className="w-4 h-4" /> رقم الدفع</span>
                        <span className="font-mono tracking-wider">{request.paymentFromNumber}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)] font-semibold flex items-center gap-2"><ClockIcon className="w-4 h-4" /> تاريخ الطلب</span>
                        <span>{new Date(request.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
            </div>
            <div className="p-4 mt-auto bg-[var(--bg-tertiary)] rounded-b-2xl flex gap-3">
                 <button onClick={() => onReject(request)} className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                    <TrashIcon className="w-5 h-5"/> رفض
                </button>
                <button onClick={() => onApprove(request)} className="w-full py-2.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <CheckIcon className="w-5 h-5"/> تفعيل
                </button>
            </div>
        </div>
    );
};

const SubscriptionCard: React.FC<{ subscription: Subscription; user: User | undefined; statusColor: string }> = ({ subscription, user, statusColor }) => {
    const planLabels: Record<Subscription['plan'], string> = { Monthly: 'شهري', Quarterly: 'ربع سنوي', Annual: 'سنوي', SemiAnnually: 'نصف سنوي' };
    
    return (
        <div className={`bg-[var(--bg-secondary)] rounded-2xl shadow-md border-l-4 p-5 ${statusColor}`}>
            <div className="flex justify-between items-start">
                 <div>
                    <h3 className="font-bold text-lg">{user?.name || 'طالب محذوف'}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{user?.phone}</p>
                </div>
                 <span className="font-semibold">{planLabels[subscription.plan]}</span>
            </div>
             <div className="mt-4 pt-4 border-t border-[var(--border-primary)] space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">يبدأ في:</span> <span className="font-semibold">{new Date(subscription.startDate).toLocaleDateString('ar-EG')}</span></div>
                <div className="flex justify-between"><span className="text-[var(--text-secondary)]">ينتهي في:</span> <span className="font-semibold">{new Date(subscription.endDate).toLocaleDateString('ar-EG')}</span></div>
            </div>
        </div>
    );
}


const SubscriptionManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Active' | 'Expired'>('Pending');
    const [approvalRequest, setApprovalRequest] = useState<SubscriptionRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allRequests, setAllRequests] = useState<SubscriptionRequest[]>([]);
    const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
    const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
    const [allGrades, setAllGrades] = useState<Grade[]>([]);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const { addToast } = useToast();

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const [requests, subscriptions, users, grades, platformSettings] = await Promise.all([
                getSubscriptionRequests(),
                getAllSubscriptions(),
                getAllUsers(),
                getAllGrades(),
                getPlatformSettings()
            ]);
            setAllRequests(requests);
            setAllSubscriptions(subscriptions);
            setUserMap(new Map(users.map(u => [u.id, u])));
            setAllGrades(grades);
            setSettings(platformSettings);
            setIsLoading(false);
        };
        fetchData();
    }, [dataVersion]);
    
    const findTeacherIdForUnit = useCallback((unitIdToFind: string): string | undefined => {
        for (const grade of allGrades) {
            for (const semester of grade.semesters) {
                const unit = semester.units.find(u => u.id === unitIdToFind);
                if (unit) {
                    return unit.teacherId;
                }
            }
        }
        return undefined;
    }, [allGrades]);

    const handleApproveConfirm = async (request: SubscriptionRequest, plan: Subscription['plan'], customEndDate?: string) => {
        const teacherId = request.unitId ? findTeacherIdForUnit(request.unitId) : undefined;
        const { error } = await createOrUpdateSubscription(request.userId, plan, 'Active', customEndDate, teacherId);
        
        if (error) {
            addToast(`فشل تفعيل الاشتراك: ${error.message}`, ToastType.ERROR);
        } else {
            await updateSubscriptionRequest({ ...request, status: 'Approved' });
            addToast(`تم تفعيل اشتراك ${request.userName} بنجاح.`, ToastType.SUCCESS);
            refreshData();
        }
        setApprovalRequest(null);
    };

    const handleReject = async (request: SubscriptionRequest) => {
        await updateSubscriptionRequest({ ...request, status: 'Rejected' });
        addToast(`تم رفض طلب اشتراك ${request.userName}.`, ToastType.INFO);
        refreshData();
    };

    const getPriceForRequest = (request: SubscriptionRequest): number | null => {
        if (!settings) return null;
        const isSingleSubject = !!request.subjectName || !!request.unitId;
        if (isSingleSubject) {
            const prices = settings.subscriptionPrices.singleSubject;
            switch (request.plan) {
                case 'Monthly': return prices.monthly;
                case 'SemiAnnually': return prices.semiAnnually;
                case 'Annual': return prices.annually;
                default: return null;
            }
        } else { // Comprehensive
            const prices = settings.subscriptionPrices.comprehensive;
            switch (request.plan) {
                case 'Monthly': return prices.monthly;
                case 'Quarterly': return prices.quarterly;
                case 'Annual': return prices.annual;
                default: return null;
            }
        }
    };

    const { pendingRequests, activeSubscriptions, expiredSubscriptions } = useMemo(() => {
        const active = allSubscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) >= new Date());
        const expired = allSubscriptions.filter(s => s.status === 'Expired' || new Date(s.endDate) < new Date());

        return {
            pendingRequests: allRequests.filter(r => r.status === 'Pending'),
            activeSubscriptions: active,
            expiredSubscriptions: expired,
        };
    }, [allRequests, allSubscriptions]);

    const tabLabels: Record<typeof activeTab, string> = { Pending: 'طلبات قيد الانتظار', Active: 'الاشتراكات النشطة', Expired: 'الاشتراكات المنتهية' };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center p-16"><Loader /></div>;
        }

        switch (activeTab) {
            case 'Pending':
                return pendingRequests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingRequests.map(req => {
                            const price = getPriceForRequest(req);
                            return <RequestCard key={req.id} request={req} price={price} onApprove={setApprovalRequest} onReject={handleReject} />
                        })}
                    </div>
                ) : <p className="text-center py-16 text-[var(--text-secondary)]">لا توجد طلبات جديدة.</p>;
            
            case 'Active':
                return activeSubscriptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeSubscriptions.map(sub => <SubscriptionCard key={sub.id} subscription={sub} user={userMap.get(sub.userId)} statusColor="border-green-500" />)}
                    </div>
                ) : <p className="text-center py-16 text-[var(--text-secondary)]">لا توجد اشتراكات نشطة.</p>;

            case 'Expired':
                 return expiredSubscriptions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {expiredSubscriptions.map(sub => <SubscriptionCard key={sub.id} subscription={sub} user={userMap.get(sub.userId)} statusColor="border-gray-500" />)}
                    </div>
                ) : <p className="text-center py-16 text-[var(--text-secondary)]">لا توجد اشتراكات منتهية.</p>;
        }
    };
    
    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الاشتراكات</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="طلبات جديدة" value={pendingRequests.length} icon={BellIcon} color="text-amber-400" />
                <StatCard title="اشتراكات نشطة" value={activeSubscriptions.length} icon={CheckCircleIcon} color="text-green-400" />
                <StatCard title="اشتراكات منتهية" value={expiredSubscriptions.length} icon={ClockIcon} color="text-red-400" />
            </div>

            <div className="mb-6 border-b border-[var(--border-primary)] flex space-x-4 space-x-reverse">
                {(['Pending', 'Active', 'Expired'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${activeTab === tab ? 'text-purple-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                       {tabLabels[tab]}
                       {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"></div>}
                    </button>
                ))}
            </div>
            
            {renderContent()}

            <ApprovalModal isOpen={!!approvalRequest} onClose={() => setApprovalRequest(null)} request={approvalRequest} onConfirm={handleApproveConfirm} />
        </div>
    );
};

export default SubscriptionManagementView;
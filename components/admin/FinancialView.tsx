import React, { useState, useMemo, useCallback } from 'react';
import { SubscriptionRequest, ToastType, Subscription, Grade } from '../../types';
import { getSubscriptionRequests, updateSubscriptionRequest, createOrUpdateSubscription, getAllSubscriptions, getAllUsers, getAllGrades } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import { BellIcon, CheckCircleIcon, ClockIcon } from '../common/Icons';

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
    
    if (!request) return null;

    const calculateDefaultEndDate = (plan: Subscription['plan']) => {
        const d = new Date();
        switch (plan) {
            case 'Monthly': d.setMonth(d.getMonth() + 1); break;
            case 'Quarterly': d.setMonth(d.getMonth() + 3); break;
            case 'SemiAnnually': d.setMonth(d.getMonth() + 6); break;
            case 'Annual': d.setFullYear(d.getFullYear() + 1); break;
        }
        return d.toISOString().split('T')[0];
    };

    const handleSubmit = () => {
        onConfirm(request, request.plan, endDate || undefined);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`تفعيل اشتراك ${request.userName}`}>
            <div className="space-y-4">
                <p>أنت على وشك تفعيل باقة <span className="font-bold">{request.plan}</span> للطالب.</p>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">تاريخ الانتهاء (اختياري)</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder={calculateDefaultEndDate(request.plan)}
                        className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">اتركه فارغًا للاحتساب التلقائي (الافتراضي: {calculateDefaultEndDate(request.plan)})</p>
                </div>
                 <div className="flex justify-end pt-4">
                    <button onClick={handleSubmit} className="px-5 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700">تأكيد التفعيل</button>
                </div>
            </div>
        </Modal>
    )
}

const SubscriptionManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Active' | 'Expired'>('Pending');
    const [approvalRequest, setApprovalRequest] = useState<SubscriptionRequest | null>(null);
    const { addToast } = useToast();

    const allRequests = useMemo(() => getSubscriptionRequests(), [dataVersion]);
    const allSubscriptions = useMemo(() => getAllSubscriptions(), [dataVersion]);
    const allUsers = useMemo(() => getAllUsers(), []);
    const allGrades = useMemo(() => getAllGrades(), []);
    const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u.name])), [allUsers]);

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

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

    const handleApproveConfirm = (request: SubscriptionRequest, plan: Subscription['plan'], customEndDate?: string) => {
        const teacherId = request.unitId ? findTeacherIdForUnit(request.unitId) : undefined;
        createOrUpdateSubscription(request.userId, plan, 'Active', customEndDate, teacherId);
        updateSubscriptionRequest({ ...request, status: 'Approved' });
        addToast(`تم تفعيل اشتراك ${request.userName} بنجاح.`, ToastType.SUCCESS);
        setApprovalRequest(null);
        refreshData();
    };

    const handleReject = (request: SubscriptionRequest) => {
        updateSubscriptionRequest({ ...request, status: 'Rejected' });
        addToast(`تم رفض طلب اشتراك ${request.userName}.`, ToastType.INFO);
        refreshData();
    };

    const pendingRequests = useMemo(() => allRequests.filter(r => r.status === 'Pending'), [allRequests]);
    const activeSubscriptions = useMemo(() => allSubscriptions.filter(s => s.status === 'Active'), [allSubscriptions]);
    const expiredSubscriptions = useMemo(() => allSubscriptions.filter(s => s.status === 'Expired'), [allSubscriptions]);

    const tabLabels: Record<typeof activeTab, string> = {
        Pending: 'طلبات قيد الانتظار',
        Active: 'الاشتراكات النشطة',
        Expired: 'الاشتراكات المنتهية',
    }

    const planLabels: Record<Subscription['plan'], string> = {
        Monthly: 'شهري',
        Quarterly: 'ربع سنوي',
        Annual: 'سنوي',
        SemiAnnually: 'نصف سنوي',
    };

    const renderRequestsTable = () => (
        <tbody>
            {pendingRequests.length > 0 ? pendingRequests.map(req => (
                <tr key={req.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{req.userName}</td>
                    <td className="px-6 py-4">{req.subjectName || 'الباقة الشاملة'}</td>
                    <td className="px-6 py-4">{planLabels[req.plan]}</td>
                    <td className="px-6 py-4 font-mono tracking-wider">{req.paymentFromNumber}</td>
                    <td className="px-6 py-4">{new Date(req.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                    <td className="px-6 py-4"><div className="flex justify-center items-center space-x-2 space-x-reverse">
                        <button onClick={() => setApprovalRequest(req)} className="px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">تفعيل</button>
                        <button onClick={() => handleReject(req)} className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">رفض</button>
                    </div></td>
                </tr>
            )) : (
                <tr><td colSpan={6} className="text-center py-16 text-[var(--text-secondary)]">لا توجد طلبات في هذا القسم.</td></tr>
            )}
        </tbody>
    );
    
    const renderSubscriptionsTable = (subscriptions: Subscription[]) => (
         <tbody>
            {subscriptions.length > 0 ? subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{userMap.get(sub.userId) || 'طالب محذوف'}</td>
                    <td className="px-6 py-4">{planLabels[sub.plan]}</td>
                    <td className="px-6 py-4">{new Date(sub.startDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-4">{new Date(sub.endDate).toLocaleDateString('ar-EG')}</td>
                </tr>
            )) : (
                 <tr><td colSpan={4} className="text-center py-16 text-[var(--text-secondary)]">لا توجد اشتراكات في هذا القسم.</td></tr>
            )}
        </tbody>
    );

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
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 relative ${activeTab === tab ? 'text-purple-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                       {tabLabels[tab]}
                       {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"></div>}
                    </button>
                ))}
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[var(--border-primary)] overflow-x-auto">
                <table className="w-full text-right text-sm text-[var(--text-secondary)]">
                    <thead className="border-b-2 border-[var(--border-primary)]">
                       {activeTab === 'Pending' ? (
                            <tr>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">المطلوب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الباقة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">رقم الدفع</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ الطلب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)] text-center">الإجراء</th>
                            </tr>
                       ) : (
                            <tr>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الباقة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ البدء</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ الانتهاء</th>
                            </tr>
                       )}
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                        {activeTab === 'Pending' && renderRequestsTable()}
                        {activeTab === 'Active' && renderSubscriptionsTable(activeSubscriptions)}
                        {activeTab === 'Expired' && renderSubscriptionsTable(expiredSubscriptions)}
                    </tbody>
                </table>
            </div>
            <ApprovalModal isOpen={!!approvalRequest} onClose={() => setApprovalRequest(null)} request={approvalRequest} onConfirm={handleApproveConfirm} />
        </div>
    );
};

export default SubscriptionManagementView;
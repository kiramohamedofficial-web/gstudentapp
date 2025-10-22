

import React, { useState, useMemo, useCallback } from 'react';
import { SubscriptionRequest, ToastType, Subscription } from '../../types';
import { getSubscriptionRequests, updateSubscriptionRequest, createOrUpdateSubscription, getAllSubscriptions, getAllUsers } from '../../services/storageService';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';

const ApprovalModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    request: SubscriptionRequest | null;
    onConfirm: (request: SubscriptionRequest, plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually', customEndDate?: string) => void;
}> = ({ isOpen, onClose, request, onConfirm }) => {
    const [endDate, setEndDate] = useState('');
    
    if (!request) return null;

    const calculateDefaultEndDate = (plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually') => {
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
                <p>أنت على وشك تفعيل باقة <span className="font-bold">{request.plan}</span> للطالب في مادة <span className="font-bold">"{request.itemName}"</span>.</p>
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
    const userMap = useMemo(() => new Map(allUsers.map(u => [u.id, u.name])), [allUsers]);

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

    const handleApproveConfirm = (request: SubscriptionRequest, plan: 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually', customEndDate?: string) => {
        createOrUpdateSubscription(request.userId, plan, 'Active', request.itemId, request.itemName, request.itemType, customEndDate);
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

    const filteredRequests = useMemo(() => allRequests.filter(r => r.status === 'Pending'), [allRequests]);
    const activeSubscriptions = useMemo(() => allSubscriptions.filter(s => s.status === 'Active'), [allSubscriptions]);
    const expiredSubscriptions = useMemo(() => allSubscriptions.filter(s => s.status === 'Expired'), [allSubscriptions]);

    const tabLabels: Record<typeof activeTab, string> = {
        Pending: 'طلبات قيد الانتظار',
        Active: 'الاشتراكات النشطة',
        Expired: 'الاشتراكات المنتهية',
    }

    const planLabels: Record<'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually', string> = {
        Monthly: 'شهري',
        Quarterly: 'ربع سنوي',
        SemiAnnually: 'نصف سنوي',
        Annual: 'سنوي'
    };

    const renderRequestsTable = () => (
        <tbody className="divide-y divide-[var(--border-primary)]">
            {filteredRequests.length > 0 ? filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{req.userName}</td>
                    <td className="px-6 py-4">{req.itemName}</td>
                    <td className="px-6 py-4">{planLabels[req.plan]}</td>
                    <td className="px-6 py-4 font-mono tracking-wider">{req.paymentFromNumber}</td>
                    <td className="px-6 py-4">{new Date(req.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center items-center space-x-2 space-x-reverse">
                            <button onClick={() => setApprovalRequest(req)} className="px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">تفعيل</button>
                            <button onClick={() => handleReject(req)} className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">رفض</button>
                        </div>
                    </td>
                </tr>
            )) : (
                <tr>
                    <td colSpan={6} className="text-center py-12 text-[var(--text-secondary)]">
                        لا توجد طلبات في هذا القسم.
                    </td>
                </tr>
            )}
        </tbody>
    );
    
    const renderSubscriptionsTable = (subscriptions: Subscription[]) => (
         <tbody className="divide-y divide-[var(--border-primary)]">
            {subscriptions.length > 0 ? subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{userMap.get(sub.userId) || 'طالب محذوف'}</td>
                    <td className="px-6 py-4">{sub.itemName}</td>
                    <td className="px-6 py-4">{planLabels[sub.plan]}</td>
                    <td className="px-6 py-4">{new Date(sub.startDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-4">{new Date(sub.endDate).toLocaleDateString('ar-EG')}</td>
                </tr>
            )) : (
                 <tr>
                    <td colSpan={5} className="text-center py-12 text-[var(--text-secondary)]">
                        لا توجد اشتراكات في هذا القسم.
                    </td>
                </tr>
            )}
        </tbody>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة الاشتراكات</h1>
            <p className="mb-8 text-[var(--text-secondary)]">مراجعة وتفعيل اشتراكات الطلاب وعرض الاشتراكات الحالية والمنتهية.</p>

            <div className="mb-6 border-b border-[var(--border-primary)] flex space-x-4 space-x-reverse">
                {(['Pending', 'Active', 'Expired'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-purple-500 text-purple-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                       {tabLabels[tab]}
                    </button>
                ))}
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-x-auto">
                <table className="w-full text-right text-sm text-[var(--text-secondary)]">
                    <thead className="bg-[var(--bg-tertiary)]">
                       {activeTab === 'Pending' ? (
                            <tr>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">المادة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الباقة المطلوبة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">رقم الدفع</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ الطلب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)] text-center">الإجراء</th>
                            </tr>
                       ) : (
                            <tr>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">المادة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الباقة</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ البدء</th>
                                <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ الانتهاء</th>
                            </tr>
                       )}
                    </thead>
                    {activeTab === 'Pending' && renderRequestsTable()}
                    {activeTab === 'Active' && renderSubscriptionsTable(activeSubscriptions)}
                    {activeTab === 'Expired' && renderSubscriptionsTable(expiredSubscriptions)}
                </table>
            </div>
            <ApprovalModal
                isOpen={!!approvalRequest}
                onClose={() => setApprovalRequest(null)}
                request={approvalRequest}
                onConfirm={handleApproveConfirm}
            />
        </div>
    );
};

export default SubscriptionManagementView;

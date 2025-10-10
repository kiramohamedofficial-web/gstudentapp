

import React, { useState, useMemo, useCallback } from 'react';
import { SubscriptionRequest, ToastType } from '../../types';
import { getSubscriptionRequests, updateSubscriptionRequest, activateSubscription } from '../../services/storageService';
import { useToast } from '../../useToast';

const SubscriptionManagementView: React.FC = () => {
    const [dataVersion, setDataVersion] = useState(0);
    const allRequests = useMemo(() => getSubscriptionRequests(), [dataVersion]);
    const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
    const { addToast } = useToast();

    const refreshData = useCallback(() => setDataVersion(v => v + 1), []);

    const handleApprove = (request: SubscriptionRequest) => {
        activateSubscription(request.userId, request.plan);
        updateSubscriptionRequest({ ...request, status: 'Approved' });
        addToast(`تم تفعيل اشتراك ${request.userName} بنجاح.`, ToastType.SUCCESS);
        refreshData();
    };

    const handleReject = (request: SubscriptionRequest) => {
        updateSubscriptionRequest({ ...request, status: 'Rejected' });
        addToast(`تم رفض طلب اشتراك ${request.userName}.`, ToastType.INFO);
        refreshData();
    };

    const filteredRequests = useMemo(() => allRequests.filter(r => r.status === activeTab), [allRequests, activeTab]);

    const renderStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
        const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
        const styles = {
            Pending: 'bg-yellow-100 text-yellow-800',
            Approved: 'bg-green-100 text-green-800',
            Rejected: 'bg-red-100 text-red-800',
        };
        return <span className={`${baseClasses} ${styles[status]}`}>{status}</span>;
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إدارة طلبات الاشتراك</h1>
            <p className="mb-8 text-[var(--text-secondary)]">مراجعة وتفعيل اشتراكات الطلاب بعد تأكيد عمليات الدفع.</p>

            <div className="mb-6 border-b border-[var(--border-primary)] flex space-x-4 space-x-reverse">
                {(['Pending', 'Approved', 'Rejected'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold transition-colors duration-200 ${activeTab === tab ? 'border-b-2 border-purple-500 text-purple-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {tab === 'Pending' ? 'طلبات قيد الانتظار' : (tab === 'Approved' ? 'المقبولة' : 'المرفوضة')}
                    </button>
                ))}
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-x-auto">
                <table className="w-full text-right text-sm text-[var(--text-secondary)]">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الباقة المطلوبة</th>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">رقم الدفع</th>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ الطلب</th>
                            {activeTab === 'Pending' && <th className="px-6 py-4 font-bold text-[var(--text-primary)] text-center">الإجراء</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                        {filteredRequests.length > 0 ? filteredRequests.map(req => (
                            <tr key={req.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                                <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{req.userName}</td>
                                <td className="px-6 py-4">{req.plan}</td>
                                <td className="px-6 py-4 font-mono tracking-wider">{req.paymentFromNumber}</td>
                                <td className="px-6 py-4">{new Date(req.createdAt).toLocaleDateString('ar-EG', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                                {activeTab === 'Pending' && (
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center space-x-2 space-x-reverse">
                                            <button onClick={() => handleApprove(req)} className="px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors">تفعيل</button>
                                            <button onClick={() => handleReject(req)} className="px-3 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">رفض</button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={activeTab === 'Pending' ? 5 : 4} className="text-center py-12 text-[var(--text-secondary)]">
                                    لا توجد طلبات في هذا القسم.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SubscriptionManagementView;
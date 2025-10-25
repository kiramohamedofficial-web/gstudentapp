import React, { useMemo, useState, useEffect } from 'react';
import { Teacher, Subscription, User } from '../../types';
import { getSubscriptionsByTeacherId, getAllUsers } from '../../services/storageService';
import { CreditCardIcon } from '../common/Icons';

interface TeacherSubscriptionsViewProps {
    teacher: Teacher;
}

const TeacherSubscriptionsView: React.FC<TeacherSubscriptionsViewProps> = ({ teacher }) => {
    const subscriptions = useMemo(() => getSubscriptionsByTeacherId(teacher.id), [teacher.id]);
    const [users, setUsers] = useState<Map<string, User>>(new Map());

    useEffect(() => {
        const fetchUsers = async () => {
            const userList = await getAllUsers();
            setUsers(new Map(userList.map(u => [u.id, u])));
        };
        fetchUsers();
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">طلابك المشتركون</h1>
            <div className="bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)] overflow-x-auto">
                <table className="w-full text-right text-sm text-[var(--text-secondary)]">
                    <thead className="bg-[var(--bg-tertiary)]">
                        <tr>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الطالب</th>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">الباقة</th>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ البدء</th>
                            <th className="px-6 py-4 font-bold text-[var(--text-primary)]">تاريخ الانتهاء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                        {subscriptions.length > 0 ? subscriptions.map(sub => {
                            const user = users.get(sub.userId);
                            return (
                                <tr key={sub.id} className="hover:bg-[var(--bg-tertiary)] transition-colors">
                                    <td className="px-6 py-4 font-semibold text-[var(--text-primary)]">{user?.name || 'طالب غير معروف'}</td>
                                    <td className="px-6 py-4">{sub.plan}</td>
                                    <td className="px-6 py-4">{new Date(sub.startDate).toLocaleDateString('ar-EG')}</td>
                                    <td className="px-6 py-4">{new Date(sub.endDate).toLocaleDateString('ar-EG')}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center py-16 text-[var(--text-secondary)]">
                                    <CreditCardIcon className="w-12 h-12 mx-auto opacity-20 mb-4"/>
                                    لا يوجد طلاب مشتركون في موادك حاليًا.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeacherSubscriptionsView;
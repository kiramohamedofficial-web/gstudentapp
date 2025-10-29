import React, { useState, useEffect, useCallback } from 'react';
import { User, ToastType } from '../../types';
import { getAllUsers, clearUserDevices, supabase, clearAllStudentDevices } from '../../services/storageService';
import { useToast } from '../../useToast';
import { HardDriveIcon, TrashIcon, ShieldExclamationIcon, LogoutIcon } from '../common/Icons';
import Loader from '../common/Loader';
import Modal from '../common/Modal';

interface ViolatingUser extends User {
    activeSessions: number;
}

const DeviceManagementView: React.FC = () => {
    const [violatingUsers, setViolatingUsers] = useState<ViolatingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    const [isLogoutAllModalOpen, setIsLogoutAllModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);

        // 1. Get all users to know their allowed device count
        const allUsers = await getAllUsers();
        if (!allUsers || allUsers.length === 0) {
            setIsLoading(false);
            return;
        }
        const userMap = new Map(allUsers.map(u => [u.id, u]));

        // 2. Get all active sessions
        const { data: activeSessions, error: sessionError } = await supabase
            .from('user_sessions')
            .select('user_id')
            .eq('active', true);

        if (sessionError) {
            addToast(`فشل جلب الجلسات: ${sessionError.message}`, ToastType.ERROR);
            setIsLoading(false);
            return;
        }

        // 3. Count active sessions per user
        const sessionCounts = new Map<string, number>();
        for (const session of activeSessions) {
            sessionCounts.set(session.user_id, (sessionCounts.get(session.user_id) || 0) + 1);
        }

        // 4. Find violating users by comparing session count with allowed devices
        const violators: ViolatingUser[] = [];
        for (const [userId, sessionCount] of sessionCounts.entries()) {
            const user = userMap.get(userId);
            // This is the fix: check sessionCount against the user's specific allowedDevices.
            if (user && sessionCount > user.allowedDevices) {
                violators.push({
                    ...user,
                    activeSessions: sessionCount,
                });
            }
        }

        setViolatingUsers(violators);
        setIsLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClearDevices = async (userId: string, userName: string) => {
        const { error } = await clearUserDevices(userId);
        if (error) {
            addToast(`فشل مسح جلسات ${userName}: ${error.message}`, ToastType.ERROR);
        } else {
            addToast(`تم مسح جلسات ${userName} بنجاح.`, ToastType.SUCCESS);
            fetchData(); // Refresh the list
        }
    };
    
    const handleLogoutAllStudents = async () => {
        setIsLogoutAllModalOpen(false);
        const { error } = await clearAllStudentDevices();
        if (error) {
            addToast(`فشل تسجيل خروج جميع الطلاب: ${error.message}`, ToastType.ERROR);
        } else {
            addToast('تم تسجيل خروج جميع الطلاب بنجاح.', ToastType.SUCCESS);
            fetchData(); // Refresh the list
        }
    };


    return (
        <div className="fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الأجهزة</h1>
                    <p className="text-[var(--text-secondary)] mt-1">فحص وعرض الحسابات التي تتجاوز الحد المسموح به من الجلسات النشطة.</p>
                </div>
                <button
                    onClick={() => setIsLogoutAllModalOpen(true)}
                    className="flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 font-semibold bg-red-600/20 text-red-300 hover:bg-red-600/40 rounded-lg transition-colors"
                >
                    <LogoutIcon className="w-5 h-5"/> 
                    <span>تسجيل خروج جميع الطلاب</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20"><Loader /></div>
            ) : violatingUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {violatingUsers.map(user => (
                        <div key={user.id} className="bg-red-900/40 border-2 border-red-500/50 rounded-xl shadow-lg p-5 flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-white">{user.name}</h3>
                                    <p className="text-sm text-red-200">{user.phone}</p>
                                </div>
                                <ShieldExclamationIcon className="w-8 h-8 text-red-400 flex-shrink-0" />
                            </div>
                            
                            <div className="text-sm space-y-2 mb-4">
                                <p className="flex justify-between">
                                    <span className="text-red-200">الجلسات النشطة:</span>
                                    <span className="font-bold text-white">{user.activeSessions}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-red-200">الأجهزة المسموح بها:</span>
                                    <span className="font-bold text-white">{user.allowedDevices}</span>
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => handleClearDevices(user.id, user.name)}
                                className="w-full mt-auto py-2.5 font-semibold bg-red-600/50 text-white hover:bg-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                مسح جميع الجلسات
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                     <HardDriveIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">لا توجد مخالفات</h3>
                    <p className="text-[var(--text-secondary)] mt-1">لا يوجد أي مستخدم لديه جلسات نشطة أكثر من المسموح به.</p>
                </div>
            )}
             <Modal isOpen={isLogoutAllModalOpen} onClose={() => setIsLogoutAllModalOpen(false)} title="تأكيد تسجيل خروج جميع الطلاب">
                <p className="text-[var(--text-secondary)] mb-6">
                    هل أنت متأكد؟ سيؤدي هذا إلى إنهاء جميع الجلسات النشطة لجميع الطلاب فورًا، وسيُطلب منهم تسجيل الدخول مرة أخرى.
                </p>
                <div className="flex justify-end space-x-3 space-x-reverse">
                    <button onClick={() => setIsLogoutAllModalOpen(false)} className="px-4 py-2 rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors">إلغاء</button>
                    <button onClick={handleLogoutAllStudents} className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition-colors text-white">نعم، تسجيل الخروج</button>
                </div>
            </Modal>
        </div>
    );
};

export default DeviceManagementView;
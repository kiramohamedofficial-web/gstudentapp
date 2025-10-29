import React, { useState, useEffect, useCallback } from 'react';
import { User, ToastType } from '../../types';
import { getAllUsers, clearUserDevices, supabase } from '../../services/storageService';
import { useToast } from '../../useToast';
import { HardDriveIcon, TrashIcon, ShieldExclamationIcon } from '../common/Icons';
import Loader from '../common/Loader';

interface ViolatingUser extends User {
    activeSessions: number;
}

const DeviceManagementView: React.FC = () => {
    const [violatingUsers, setViolatingUsers] = useState<ViolatingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        
        // 1. Get all active sessions
        const { data: activeSessions, error: sessionError } = await supabase
            .from('device_sessions')
            .select('user_id')
            .eq('active', true);
            
        if (sessionError) {
            addToast(`فشل جلب الجلسات: ${sessionError.message}`, ToastType.ERROR);
            setIsLoading(false);
            return;
        }

        // 2. Count active sessions per user
        const sessionCounts = new Map<string, number>();
        for (const session of activeSessions) {
            sessionCounts.set(session.user_id, (sessionCounts.get(session.user_id) || 0) + 1);
        }

        // 3. Find users with more than one active session
        const violatingUserIds = Array.from(sessionCounts.entries())
            .filter(([_, count]) => count > 1)
            .map(([userId, _]) => userId);

        if (violatingUserIds.length > 0) {
            // 4. Fetch profiles for violating users
            const allUsers = await getAllUsers();
            const violators = allUsers
                .filter(user => violatingUserIds.includes(user.id))
                .map(user => ({
                    ...user,
                    activeSessions: sessionCounts.get(user.id) || 0,
                }));
            setViolatingUsers(violators);
        } else {
            setViolatingUsers([]);
        }

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

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الأجهزة</h1>
            <p className="text-[var(--text-secondary)] mt-1 mb-8">فحص وعرض الحسابات التي لديها أكثر من جلسة نشطة في نفس الوقت (حالة استثنائية).</p>

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
                    <p className="text-[var(--text-secondary)] mt-1">لا يوجد أي مستخدم لديه أكثر من جلسة نشطة.</p>
                </div>
            )}
        </div>
    );
};

export default DeviceManagementView;
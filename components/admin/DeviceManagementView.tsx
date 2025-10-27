import React, { useState, useEffect, useCallback } from 'react';
import { User, ToastType } from '../../types';
import { getAllUsers, clearUserDevices } from '../../services/storageService';
import { useToast } from '../../useToast';
import { HardDriveIcon, TrashIcon, ShieldExclamationIcon } from '../common/Icons';
import Loader from '../common/Loader';

const DeviceManagementView: React.FC = () => {
    const [violatingUsers, setViolatingUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const users = await getAllUsers();
        const violators = users.filter(user => 
            user.role === 'student' && 
            user.device_ids && 
            user.device_limit && 
            user.device_ids.length > user.device_limit
        );
        setViolatingUsers(violators);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleClearDevices = async (userId: string, userName: string) => {
        const { error } = await clearUserDevices(userId);
        if (error) {
            addToast(`فشل مسح أجهزة ${userName}: ${error.message}`, ToastType.ERROR);
        } else {
            addToast(`تم مسح أجهزة ${userName} بنجاح.`, ToastType.SUCCESS);
            fetchData(); // Refresh the list
        }
    };

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الأجهزة</h1>
            <p className="text-[var(--text-secondary)] mt-1 mb-8">فحص وعرض الحسابات التي تتجاوز الحد المسموح به للأجهزة.</p>

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
                                    <span className="text-red-200">الأجهزة المسجلة:</span>
                                    <span className="font-bold text-white">{user.device_ids?.length || 0}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-red-200">الحد المسموح:</span>
                                    <span className="font-bold text-white">{user.device_limit || 1}</span>
                                </p>
                            </div>
                            
                            <button 
                                onClick={() => handleClearDevices(user.id, user.name)}
                                className="w-full mt-auto py-2.5 font-semibold bg-red-600/50 text-white hover:bg-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <TrashIcon className="w-5 h-5"/>
                                مسح الأجهزة المسجلة
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 bg-[var(--bg-secondary)] rounded-xl border-2 border-dashed border-[var(--border-primary)]">
                     <HardDriveIcon className="w-20 h-20 mx-auto text-[var(--text-secondary)] opacity-20 mb-4" />
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">لا توجد مخالفات</h3>
                    <p className="text-[var(--text-secondary)] mt-1">جميع حسابات الطلاب تلتزم بحد الأجهزة المسموح به.</p>
                </div>
            )}
        </div>
    );
};

export default DeviceManagementView;
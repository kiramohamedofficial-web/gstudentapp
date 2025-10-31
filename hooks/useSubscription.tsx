import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { getSubscriptionsByUserId } from '../services/storageService';
import { Subscription, AppNotification } from '../types';
import { useSession } from './useSession';

interface SubscriptionContextType {
    subscriptions: Subscription[];
    // For simple UI, provide the most relevant active subscription (e.g., comprehensive or first active one)
    subscription: Subscription | null;
    isLoading: boolean;
    refetchSubscription: () => void;
    notifications: AppNotification[];
    activeSubscriptions: Subscription[];
    isComprehensive: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useSession();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const fetchSubscription = useCallback(async () => {
        if (currentUser) {
            setIsLoading(true);
            try {
                const subsData = await getSubscriptionsByUserId(currentUser.id);
                // FIX: Map snake_case fields from DB to camelCase fields in the frontend type.
                const mappedSubs = subsData.map((sub: any) => ({
                    id: sub.id,
                    userId: sub.user_id,
                    plan: sub.plan,
                    startDate: sub.start_date,
                    endDate: sub.end_date,
                    status: sub.status,
                    teacherId: sub.teacher_id,
                }));
                setSubscriptions(mappedSubs);
            } catch (error) {
                console.error("Failed to fetch subscriptions:", error);
                setSubscriptions([]); // Reset to empty on error to ensure a consistent state
            } finally {
                setIsLoading(false);
            }
        } else {
            setSubscriptions([]);
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);

    useEffect(() => {
        if (subscriptions.length > 0) {
            const newNotifications: AppNotification[] = [];
            const now = new Date();

            subscriptions.forEach(sub => {
                if (sub.status === 'Active') {
                    const endDate = new Date(sub.endDate);
                    const diffTime = endDate.getTime() - now.getTime();
                    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (daysRemaining <= 5 && daysRemaining >= 0) {
                        let remainingText: string;
                        if (daysRemaining === 0) {
                            remainingText = 'اشتراكك ينتهي اليوم! جدده الآن للاستمرار في الوصول للمحتوى.';
                        } else {
                            const dayWord = daysRemaining === 1 ? 'يوم واحد' : daysRemaining === 2 ? 'يومان' : `${daysRemaining} أيام`;
                            remainingText = `⚠️ تنبيه: اشتراكك الحالي سينتهي بعد ${dayWord}. لا تنسَ التجديد لضمان استمرار الوصول إلى محتواك!`;
                        }
                        
                        newNotifications.push({
                            id: `sub-expire-${sub.id}`,
                            text: remainingText,
                            type: 'warning',
                            createdAt: new Date().toISOString(),
                            link: 'subscription'
                        });
                    }
                }
            });
            setNotifications(newNotifications);
        } else {
            setNotifications([]);
        }
    }, [subscriptions]);
    
    const activeSubscriptions = useMemo(() => {
        return subscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) >= new Date());
    }, [subscriptions]);

    const isComprehensive = useMemo(() => {
        return activeSubscriptions.some(s => !s.teacherId);
    }, [activeSubscriptions]);
    
    // Determine the primary subscription for display purposes
    const primarySubscription = useMemo(() => {
        if (subscriptions.length === 0) return null;
        if (activeSubscriptions.length === 0) return subscriptions[0]; // return the most recent (expired) one
        // Prioritize comprehensive subscription
        const comprehensive = activeSubscriptions.find(s => !s.teacherId);
        return comprehensive || activeSubscriptions[0];
    }, [subscriptions, activeSubscriptions]);
    
    const value = {
        subscriptions,
        subscription: primarySubscription,
        isLoading,
        refetchSubscription: fetchSubscription,
        notifications,
        activeSubscriptions,
        isComprehensive,
    };

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
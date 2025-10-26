import React, { createContext, useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { getSubscriptionsByUserId } from '../services/storageService';
import { Subscription } from '../types';
import { useSession } from './useSession';

interface SubscriptionContextType {
    subscriptions: Subscription[];
    // For simple UI, provide the most relevant active subscription (e.g., comprehensive or first active one)
    subscription: Subscription | null;
    isLoading: boolean;
    refetchSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useSession();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubscription = useCallback(async () => {
        if (currentUser) {
            setIsLoading(true);
            const subs = await getSubscriptionsByUserId(currentUser.id);
            setSubscriptions(subs);
            setIsLoading(false);
        } else {
            setSubscriptions([]);
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);
    
    // Determine the primary subscription for display purposes
    const primarySubscription = useMemo(() => {
        if (subscriptions.length === 0) return null;
        const activeSubs = subscriptions.filter(s => s.status === 'Active' && new Date(s.endDate) >= new Date());
        if (activeSubs.length === 0) return subscriptions[0]; // return the most recent (expired) one
        // Prioritize comprehensive subscription
        const comprehensive = activeSubs.find(s => !s.teacherId);
        return comprehensive || activeSubs[0];
    }, [subscriptions]);
    
    const value = {
        subscriptions,
        subscription: primarySubscription,
        isLoading,
        refetchSubscription: fetchSubscription,
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

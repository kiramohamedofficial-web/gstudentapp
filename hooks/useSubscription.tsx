import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getSubscriptionByUserId } from '../services/storageService';
import { Subscription } from '../types';
import { useSession } from './useSession';

interface SubscriptionContextType {
    subscription: Subscription | null;
    isLoading: boolean;
    refetchSubscription: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useSession();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSubscription = useCallback(async () => {
        if (currentUser) {
            setIsLoading(true);
            const sub = await getSubscriptionByUserId(currentUser.id);
            setSubscription(sub);
            setIsLoading(false);
        } else {
            setSubscription(null);
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchSubscription();
    }, [fetchSubscription]);
    
    const value = {
        subscription,
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

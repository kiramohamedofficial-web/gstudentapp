import React, { useMemo, useState } from 'react';
import { User, StudentView, Subscription } from '../../types';
import { getSubscriptionByUserId } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon, SparklesIcon, CheckIcon } from '../common/Icons';

interface SubscriptionViewProps {
  user: User;
  onNavigate: (view: StudentView) => void;
}

type PlanName = 'Monthly' | 'Quarterly' | 'Annual';

interface Plan {
    name: string;
    plan: PlanName;
    price: number;
    originalPrice?: number;
    savePercent?: number;
    features: string[];
    isPopular: boolean;
}

const plans: Plan[] = [
    { name: 'شهري', plan: 'Monthly', price: 100, features: ['الوصول إلى جميع الدروس', 'تصحيح الواجبات', 'امتحانات شهرية'], isPopular: false },
    { name: 'ربع سنوي', plan: 'Quarterly', price: 249, originalPrice: 300, savePercent: 17, features: ['جميع ميزات الباقة الشهرية', 'دعم ذو أولوية', 'ملخصات قابلة للتنزيل'], isPopular: true },
    { name: 'سنوي', plan: 'Annual', price: 799, originalPrice: 1200, savePercent: 33, features: ['جميع ميزات الباقة الربع سنوية', 'جلسات مراجعة مباشرة', 'وصول حصري للكورسات'], isPopular: false },
];

const CurrentPlanCard: React.FC<{ subscription: Subscription; onNavigate: (view: StudentView) => void }> = ({ subscription, onNavigate }) => {
    const planDetails = plans.find(p => p.plan === subscription.plan) || plans[0];
    const daysRemaining = Math.ceil(Math.max(0, (new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

    return (
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 md:p-8 border border-[var(--border-primary)] shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="text-right mb-4 sm:mb-0">
                    <h2 className="text-3xl font-bold text-[var(--text-primary)]">خطتك الحالية: {planDetails.name}</h2>
                    <span className="inline-block mt-2 px-3 py-1 text-sm font-semibold rounded-full bg-blue-500/10 text-blue-400">نشط</span>
                </div>
                <div className="flex items-baseline text-right">
                    <span className="text-5xl font-black text-[var(--text-primary)]">{planDetails.price}</span>
                    <div className="mr-2"><p className="text-lg text-[var(--text-secondary)]">جنيه</p></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-xl flex items-center space-x-4 space-x-reverse">
                    <ClockIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                    <div>
                        <p className="text-sm text-[var(--text-secondary)]">متبقي على التجديد</p>
                        <p className="text-lg font-bold text-[var(--text-primary)]">{daysRemaining} يوم</p>
                    </div>
                </div>
                 <button onClick={() => onNavigate('comprehensiveSubscription')} className="bg-amber-400/10 text-amber-300 font-bold p-4 rounded-xl hover:bg-amber-400/20 transition-colors h-full flex items-center justify-center space-x-2 space-x-reverse">
                    <SparklesIcon className="w-6 h-6"/>
                    <span>ترقية الباقة</span>
                </button>
            </div>
        </div>
    );
};

const PlanCard: React.FC<{ plan: Plan, onSelect: (planName: PlanName) => void }> = ({ plan, onSelect }) => (
    <div className={`relative bg-[var(--bg-secondary)] rounded-2xl p-6 border-2 flex flex-col transition-all duration-300 ${plan.isPopular ? 'border-amber-400 shadow-lg shadow-amber-500/10' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}>
        {plan.isPopular && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-4 py-1 text-sm font-bold rounded-full">الأكثر شيوعاً</div>}
        <h3 className="text-2xl font-bold text-center text-[var(--text-primary)] mt-4">{plan.name}</h3>
        <div className="text-center my-6">
            <span className="text-5xl font-extrabold text-[var(--text-primary)]">{plan.price}</span>
            <span className="text-md text-[var(--text-secondary)]"> / جنيه</span>
            {plan.originalPrice && (
                <p className="text-sm mt-2"><span className="line-through text-red-400/70">{plan.originalPrice} جنيه</span><span className="font-bold text-green-400 mr-2">وفر {plan.savePercent}%</span></p>
            )}
        </div>
        <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center"><CheckIcon className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" /><span className="text-[var(--text-secondary)]">{feature}</span></li>
            ))}
        </ul>
        <button onClick={() => onSelect(plan.plan)} className={`w-full mt-auto py-3 font-bold rounded-lg transition-all duration-300 ${plan.isPopular ? 'bg-amber-400 text-black hover:bg-amber-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>اختر الباقة</button>
    </div>
);

const SubscriptionView: React.FC<SubscriptionViewProps> = ({ user, onNavigate }) => {
    const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id]);
    const hasActiveSubscription = subscription && subscription.status === 'Active' && new Date(subscription.endDate) > new Date();

    const handleSelectPlan = () => {
        onNavigate('comprehensiveSubscription');
    };
    
    if (hasActiveSubscription) {
        return (
             <div className="max-w-4xl mx-auto space-y-12">
                <h1 className="text-3xl font-extrabold text-center text-[var(--text-primary)]">إدارة خطة اشتراكك</h1>
                <CurrentPlanCard subscription={subscription} onNavigate={onNavigate} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-3 text-[var(--text-primary)]">باقات الاشتراك الشامل</h1>
                <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-12">اختر الباقة التي تناسبك واستمتع بوصول غير محدود لكل محتوى المنصة.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map((plan, index) => (
                    <div key={plan.plan} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <PlanCard plan={plan} onSelect={handleSelectPlan} />
                    </div>
                ))}
            </div>
             <div className="text-center mt-12">
                 <button onClick={() => onNavigate('singleSubjectSubscription')} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold transition-colors">أو يمكنك الاشتراك في مادة واحدة فقط &larr;</button>
            </div>
        </div>
    );
};

export default SubscriptionView;
import React, { useState, useEffect, useMemo } from 'react';
import { User, ToastType, SubscriptionRequest, PlatformSettings } from '../../types';
import { addSubscriptionRequest, getPlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import { ArrowRightIcon, CheckIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import Loader from '../common/Loader';

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

const PlanCard: React.FC<{ plan: Plan, onSelect: (plan: Plan) => void }> = ({ plan, onSelect }) => (
    <div className={`relative bg-[var(--bg-secondary)] rounded-2xl p-6 border-2 flex flex-col transition-all duration-300 ${plan.isPopular ? 'border-amber-400 shadow-lg shadow-amber-500/10' : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}>
        {plan.isPopular && (
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-4 py-1 text-sm font-bold rounded-full">
                الأكثر شيوعاً
            </div>
        )}
        <h3 className="text-2xl font-bold text-center text-[var(--text-primary)] mt-4">{plan.name}</h3>
        <div className="text-center my-6">
            <span className="text-5xl font-extrabold text-[var(--text-primary)]">{plan.price}</span>
            <span className="text-md text-[var(--text-secondary)]"> / جنيه</span>
            {plan.originalPrice && (
                <p className="text-sm mt-2">
                    <span className="line-through text-red-400/70">{plan.originalPrice} جنيه</span>
                    <span className="font-bold text-green-400 mr-2">وفر {plan.savePercent}%</span>
                </p>
            )}
        </div>
        <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                    <CheckIcon className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" />
                    <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
            ))}
        </ul>
        <button 
            onClick={() => onSelect(plan)}
            className={`w-full mt-auto py-3 font-bold rounded-lg transition-all duration-300 ${plan.isPopular ? 'bg-amber-400 text-black hover:bg-amber-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
        >
            اختر الباقة
        </button>
    </div>
);


const PurchaseModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    plan: Plan | null;
    onConfirm: (plan: PlanName, paymentNumber: string) => void;
    vodafoneCashNumber: string;
}> = ({ isOpen, onClose, plan, onConfirm, vodafoneCashNumber }) => {
    const [paymentNumber, setPaymentNumber] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        setError('');
        const phoneRegex = /^01[0125]\d{8}$/;
        if (!phoneRegex.test(paymentNumber)) {
            setError('الرجاء إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01).');
            return;
        }
        if (plan) {
            onConfirm(plan.plan, paymentNumber);
        }
    };

    if (!plan) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`تأكيد الاشتراك في الباقة الـ${plan.name}`}>
             <div className="space-y-4">
                <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">الباقة المختارة: {plan.name}</h3>
                    <p className="mt-2 text-2xl font-extrabold text-[var(--text-accent)]">{plan.price} ج.م</p>
                </div>
                 <div>
                    <h4 className="font-semibold mb-2">تعليمات الدفع:</h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        لإتمام الاشتراك، يرجى تحويل المبلغ المطلوب عبر فودافون كاش على الرقم <span className="font-bold text-[var(--text-primary)] dir-ltr d-inline-block">{vodafoneCashNumber}</span>.
                    </p>
                </div>
                 <div>
                    <label htmlFor="paymentNumberModal" className="block font-medium text-[var(--text-secondary)] mb-2">أدخل الرقم الذي قمت بالتحويل منه:</label>
                    <input
                        id="paymentNumberModal"
                        type="tel"
                        value={paymentNumber}
                        onChange={(e) => setPaymentNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="مثال: 01012345678"
                        maxLength={11}
                        className="w-full p-3 text-center tracking-widest bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        required
                    />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end pt-4">
                    <button onClick={onClose} className="px-5 py-2 font-medium bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-primary)] ml-3">إلغاء</button>
                    <button onClick={handleSubmit} className="px-5 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">تأكيد الاشتراك</button>
                </div>
            </div>
        </Modal>
    );
};


interface ComprehensiveSubscriptionProps {
  onBack: () => void;
}

const ComprehensiveSubscription: React.FC<ComprehensiveSubscriptionProps> = ({ onBack }) => {
    const { currentUser: user } = useSession();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await getPlatformSettings();
            setSettings(data);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const plans = useMemo((): Plan[] => {
        if (!settings) return [];
        const { monthly, quarterly, annual } = settings.subscriptionPrices.comprehensive;
        return [
            { name: 'شهري', plan: 'Monthly', price: monthly, features: ['الوصول إلى جميع الدروس', 'تصحيح الواجبات', 'امتحانات شهرية'], isPopular: false },
            { name: 'ربع سنوي', plan: 'Quarterly', price: quarterly, originalPrice: monthly * 3, savePercent: Math.round((1 - quarterly / (monthly * 3)) * 100), features: ['جميع ميزات الباقة الشهرية', 'دعم ذو أولوية', 'ملخصات قابلة للتنزيل'], isPopular: true },
            { name: 'سنوي', plan: 'Annual', price: annual, originalPrice: monthly * 12, savePercent: Math.round((1 - annual / (monthly * 12)) * 100), features: ['جميع ميزات الباقة الربع سنوية', 'جلسات مراجعة مباشرة', 'وصول حصري للكورسات'], isPopular: false },
        ];
    }, [settings]);

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    const handleConfirmPurchase = (plan: PlanName, paymentNumber: string) => {
        if (!user) return;
        addSubscriptionRequest(user.id, user.name, plan as SubscriptionRequest['plan'], paymentNumber, 'الباقة الشاملة');
        addToast('تم إرسال طلب الاشتراك بنجاح. سيتم تفعيله بعد المراجعة.', ToastType.SUCCESS);
        setIsModalOpen(false);
        onBack();
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى خيارات الاشتراك</span>
            </button>
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

            <PurchaseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                plan={selectedPlan}
                onConfirm={handleConfirmPurchase}
                vodafoneCashNumber={settings?.paymentNumbers.vodafoneCash || ''}
            />
        </div>
    );
};

export default ComprehensiveSubscription;
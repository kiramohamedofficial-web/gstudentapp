import React, { useState, useMemo, useEffect } from 'react';
import { User, SubscriptionRequest, Grade, ToastType, Unit, PlatformSettings } from '../../types';
import { getGradeByIdSync, addSubscriptionRequest, getPlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import { ArrowRightIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import Loader from '../common/Loader';

interface SingleSubjectSubscriptionProps {
  onBack: () => void;
}

type Plan = 'Monthly' | 'Quarterly' | 'SemiAnnually' | 'Annual';

const planLabels: Record<Plan, string> = {
    Monthly: 'شهري',
    Quarterly: 'ربع سنوي',
    SemiAnnually: 'نصف سنوي',
    Annual: 'سنوي',
};

const PlanPill: React.FC<{ plan: Plan; currentPlan: Plan; onSelect: (plan: Plan) => void; price: number }> = ({ plan, currentPlan, onSelect, price }) => (
    <button
        onClick={() => onSelect(plan)}
        className={`w-full p-4 rounded-xl text-right transition-all duration-300 border-2 ${
            currentPlan === plan 
                ? 'bg-amber-500/10 border-amber-500 shadow-lg' 
                : 'bg-[var(--bg-tertiary)] border-transparent hover:border-[var(--border-secondary)]'
        }`}
    >
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-lg text-[var(--text-primary)]">{planLabels[plan]}</p>
                <p className="text-sm text-[var(--text-secondary)]">فاتورة كل {plan === 'Monthly' ? 'شهر' : plan === 'Quarterly' ? '3 أشهر' : plan === 'SemiAnnually' ? '6 أشهر' : 'سنة'}</p>
            </div>
            <p className="text-xl font-extrabold text-[var(--text-accent)]">{price} ج.م</p>
        </div>
    </button>
);

const SingleSubjectSubscription: React.FC<SingleSubjectSubscriptionProps> = ({ onBack }) => {
    const { currentUser: user } = useSession();
    const { addToast } = useToast();
    const grade = useMemo(() => user ? getGradeByIdSync(user.grade) : null, [user]);

    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUnitId, setSelectedUnitId] = useState<string>('');
    const [selectedPlan, setSelectedPlan] = useState<Plan>('Monthly');
    const [paymentNumber, setPaymentNumber] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            const data = await getPlatformSettings();
            setSettings(data);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const availableSubjects = useMemo(() => {
        if (!grade || !user) return [];
        return grade.semesters.flatMap(s => s.units.filter(u => 
            !u.track || u.track === 'All' || u.track === user.track
        ));
    }, [grade, user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!user) {
            setError('User not found.');
            return;
        }

        if (!selectedUnitId) {
            setError('الرجاء اختيار المادة أولاً.');
            return;
        }

        const phoneRegex = /^01[0125]\d{8}$/;
        if (!phoneRegex.test(paymentNumber)) {
            setError('الرجاء إدخال رقم هاتف مصري صحيح (11 رقم يبدأ بـ 01).');
            return;
        }

        const selectedSubject = availableSubjects.find(u => u.id === selectedUnitId);
        if (!selectedSubject) {
            setError('حدث خطأ غير متوقع. لم يتم العثور على المادة المختارة.');
            return;
        }

        addSubscriptionRequest(user.id, user.name, selectedPlan, paymentNumber, selectedSubject.title, selectedUnitId);
        addToast('تم إرسال طلب الاشتراك بنجاح. سيتم تفعيله بعد المراجعة.', ToastType.SUCCESS);
        onBack();
    };

    if (isLoading || !user || !settings) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    const prices = {
        monthly: settings.monthlyPrice,
        quarterly: settings.quarterlyPrice,
        semiAnnually: settings.semiAnnuallyPrice,
        annually: settings.annualPrice
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={onBack} className="flex items-center space-x-2 space-x-reverse mb-6 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ArrowRightIcon className="w-4 h-4" />
                <span>العودة إلى خيارات الاشتراك</span>
            </button>
            <h1 className="text-3xl font-bold mb-2 text-[var(--text-primary)]">الاشتراك في مادة</h1>
            <p className="text-[var(--text-secondary)] mb-8">اختر المادة ومدة الاشتراك المناسبة لك لإتمام الطلب.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Step 1: Subject Selection */}
                <div>
                    <label htmlFor="subject" className="block text-lg font-semibold text-[var(--text-primary)] mb-3">1. اختر المادة</label>
                    <select
                        id="subject"
                        value={selectedUnitId}
                        onChange={(e) => setSelectedUnitId(e.target.value)}
                        className="w-full p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl appearance-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="" disabled>-- اختر من القائمة --</option>
                        {availableSubjects.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.title}</option>
                        ))}
                    </select>
                </div>

                {/* Step 2: Plan Selection */}
                <div>
                     <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">2. اختر مدة الاشتراك</h2>
                     <div className="space-y-3">
                        {prices.monthly > 0 && <PlanPill plan="Monthly" currentPlan={selectedPlan} onSelect={setSelectedPlan} price={prices.monthly} />}
                        {prices.quarterly > 0 && <PlanPill plan="Quarterly" currentPlan={selectedPlan} onSelect={setSelectedPlan} price={prices.quarterly} />}
                        {prices.semiAnnually > 0 && <PlanPill plan="SemiAnnually" currentPlan={selectedPlan} onSelect={setSelectedPlan} price={prices.semiAnnually} />}
                        {prices.annually > 0 && <PlanPill plan="Annual" currentPlan={selectedPlan} onSelect={setSelectedPlan} price={prices.annually} />}
                     </div>
                </div>

                {/* Step 3: Payment */}
                <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">3. تأكيد الدفع</h2>
                    <div className="bg-[var(--bg-secondary)] p-5 rounded-xl border border-[var(--border-primary)] space-y-4">
                        <div className="text-center bg-[var(--bg-tertiary)] p-4 rounded-lg">
                            <p className="text-[var(--text-secondary)]">قم بتحويل المبلغ إلى أحد الأرقام التالية:</p>
                             <div className="text-center mt-2 space-y-1">
                                {settings.paymentNumbers.map(num => (
                                    <p key={num} className="text-2xl font-bold text-[var(--text-primary)] tracking-widest">{num}</p>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label htmlFor="paymentNumber" className="block font-medium text-[var(--text-secondary)] mb-2">أدخل الرقم الذي قمت بالتحويل منه:</label>
                             <input
                                id="paymentNumber"
                                type="tel"
                                value={paymentNumber}
                                onChange={(e) => setPaymentNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="مثال: 01012345678"
                                maxLength={11}
                                className="w-full p-3 text-center tracking-widest bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                required
                             />
                        </div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-3 rounded-lg">{error}</p>}
                
                <button 
                    type="submit"
                    className="w-full py-4 font-bold text-lg text-white bg-blue-600 rounded-xl 
                               hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                               transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedUnitId}
                >
                    تأكيد طلب الاشتراك
                </button>
            </form>
        </div>
    );
};

export default SingleSubjectSubscription;

import React, { useMemo, useState } from 'react';
import { User, ToastType } from '../../types';
import { getSubscriptionByUserId, addSubscriptionRequest, getUserSubscriptionRequest } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon } from '../common/Icons';
import { useToast } from '../../useToast';

interface SubscriptionProps {
  user: User;
}

const Subscription: React.FC<SubscriptionProps> = ({ user }) => {
  const [selectedPlan, setSelectedPlan] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Quarterly');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const { addToast } = useToast();

  const subscription = useMemo(() => getSubscriptionByUserId(user.id), [user.id, formSubmitted]);
  const pendingRequest = useMemo(() => getUserSubscriptionRequest(user.id), [user.id, formSubmitted]);

  const VODAFONE_CASH_NUMBER = '01012345678';

  const pricingPlans = [
    { id: 'Monthly', name: 'شهري', price: '100 جنيه', features: ['الوصول إلى جميع الدروس', 'تصحيح الواجبات', 'امتحانات شهرية'] },
    { id: 'Quarterly', name: 'ربع سنوي', price: '250 جنيه', features: ['جميع ميزات الباقة الشهرية', 'دعم ذو أولوية', 'ملخصات قابلة للتنزيل'], popular: true },
    { id: 'Annual', name: 'سنوي', price: '800 جنيه', features: ['جميع ميزات الباقة الربع سنوية', 'وصول لمدة عام كامل', 'جلسات مراجعة حصرية'] },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentNumber.trim() || !/^(01[0-2,5])\d{8}$/.test(paymentNumber.trim())) {
      addToast('الرجاء إدخال رقم هاتف مصري صحيح.', ToastType.ERROR);
      return;
    }
    addSubscriptionRequest(user.id, user.name, selectedPlan, paymentNumber);
    setFormSubmitted(true);
    addToast('تم إرسال طلب الاشتراك بنجاح!', ToastType.SUCCESS);
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const translatePlanName = (plan: 'Monthly' | 'Quarterly' | 'Annual') => pricingPlans.find(p => p.id === plan)?.name || plan;

  const renderActiveSubscription = () => (
      <div className="p-6 bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)] text-center">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">باقتك الحالية</h2>
        <div className="flex flex-col items-center justify-center space-y-3">
            <CheckCircleIcon className="w-16 h-16 text-green-500"/>
            <p className="font-semibold text-xl text-[var(--text-primary)]">باقة {translatePlanName(subscription!.plan)}</p>
            <div className={`px-4 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400`}>
              نشط
            </div>
            <p className="text-[var(--text-secondary)]">
                {`ينتهي في: ${formatDate(subscription!.endDate)}`}
            </p>
        </div>
      </div>
  );

  const renderPendingRequest = () => (
    <div className="p-6 bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)] text-center">
      <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">تم استلام طلبك</h2>
      <div className="flex flex-col items-center justify-center space-y-3">
        <ClockIcon className="w-16 h-16 text-yellow-500"/>
        <p className="font-semibold text-xl text-[var(--text-primary)]">طلب اشتراك في باقة {translatePlanName(pendingRequest!.plan)}</p>
        <div className={`px-4 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400`}>
          قيد المراجعة
        </div>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          طلبك قيد المراجعة حالياً. سيتم تفعيل الاشتراك خلال 24 ساعة من تأكيد عملية الدفع. شكراً لك!
        </p>
      </div>
    </div>
  );

  const renderNewSubscriptionForm = () => (
    <>
      <div className="p-6 mb-8 bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">خطوات الاشتراك</h2>
        <ol className="list-decimal list-inside space-y-2 text-[var(--text-secondary)]">
            <li>اختر الباقة المناسبة لك من الأسفل.</li>
            <li>قم بتحويل قيمة الاشتراك إلى رقم فودافون كاش التالي: <strong className="text-[var(--accent-primary)] font-bold tracking-wider">{VODAFONE_CASH_NUMBER}</strong></li>
            <li>اكتب رقم الهاتف الذي قمت بالتحويل منه في الخانة المخصصة.</li>
            <li>اضغط على زر "إرسال طلب الاشتراك" وانتظر التفعيل.</li>
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {pricingPlans.map(plan => (
          <div 
            key={plan.id} 
            onClick={() => setSelectedPlan(plan.id as any)}
            className={`relative p-6 border-2 rounded-2xl shadow-md flex flex-col cursor-pointer transition-all duration-300 ${selectedPlan === plan.id ? 'border-[var(--accent-primary)] scale-105' : 'border-[var(--border-primary)] hover:border-[var(--text-secondary)]'}`}
          >
            {plan.popular && <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-white bg-[var(--accent-primary)] rounded-full">الأكثر شيوعًا</div>}
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
            <p className="mt-2 text-3xl font-extrabold text-[var(--text-primary)]">{plan.price}</p>
            <ul className="mt-6 space-y-3 flex-grow text-[var(--text-secondary)]">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2 flex-shrink-0 mt-1" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-[var(--bg-primary)] rounded-xl shadow-lg border border-[var(--border-primary)]">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">تأكيد الاشتراك</h2>
          <p className="text-[var(--text-secondary)] mb-4">
              أنت على وشك طلب الاشتراك في <strong className="text-[var(--text-primary)]">باقة {translatePlanName(selectedPlan)}</strong>.
              الرجاء إدخال رقم الهاتف الذي تم التحويل منه.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
              <input
                  type="tel"
                  value={paymentNumber}
                  onChange={(e) => setPaymentNumber(e.target.value)}
                  placeholder="رقم الهاتف الذي تم التحويل منه"
                  required
                  className="flex-grow mt-1 block w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all placeholder-[var(--text-secondary)]"
              />
              <button 
                type="submit" 
                className="w-full sm:w-auto py-3 px-6 font-bold text-white bg-gradient-to-r from-blue-600 to-green-500 rounded-lg 
                           hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                           transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                إرسال طلب الاشتراك
              </button>
          </div>
      </form>
    </>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">الاشتراك وتجديد الباقة</h1>
      {subscription?.status === 'Active' ? renderActiveSubscription() : 
       (pendingRequest ? renderPendingRequest() : renderNewSubscriptionForm())}
    </div>
  );
};

export default Subscription;
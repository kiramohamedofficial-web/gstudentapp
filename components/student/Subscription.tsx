import React, { useMemo, useState, useEffect } from 'react';
import { User, ToastType, Unit, Course, Grade, Subscription } from '../../types';
import { getSubscriptionsByUserId, addSubscriptionRequest, getPendingSubscriptionRequestForItem, getGradeById, getFeaturedCourses, redeemPrepaidCode } from '../../services/storageService';
import { CheckCircleIcon, ClockIcon, BookOpenIcon, VideoCameraIcon, SparklesIcon, ArrowRightIcon, ArrowLeftIcon, KeyIcon } from '../common/Icons';
import { useToast } from '../../useToast';

interface SubscriptionProps {
  user: User;
  targetUnit: Unit | null;
  onBackToSubjects: () => void;
}

type SubscriptionView = 'selection' | 'unit' | 'course' | 'full';
type PlanName = 'Monthly' | 'Quarterly' | 'Annual' | 'SemiAnnually';

const SubscriptionTypeCard: React.FC<{ title: string; description: string; icon: React.FC<{ className?: string }>; onClick: () => void; }> = ({ title, description, icon: Icon, onClick }) => (
    <button
        onClick={onClick}
        className="w-full p-5 bg-[var(--bg-secondary)] rounded-2xl shadow-md border border-[var(--border-primary)] text-right transition-all duration-300 transform hover:-translate-y-1 hover:border-[var(--accent-primary)] hover:shadow-lg flex items-center space-x-4 space-x-reverse group"
    >
        <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl transition-colors duration-300 group-hover:bg-[var(--accent-primary)]/20">
            <Icon className="w-8 h-8 text-[var(--text-accent)] transition-transform duration-300 group-hover:scale-110" />
        </div>
        <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        </div>
        <div className="p-2.5 bg-[var(--bg-tertiary)] rounded-full transition-all duration-300 group-hover:bg-[var(--accent-primary)] group-hover:text-white group-hover:-translate-x-1">
            <ArrowLeftIcon className="w-5 h-5" />
        </div>
    </button>
);

const PricingPlanCard: React.FC<{ plan: any, isSelected: boolean, onSelect: () => void }> = ({ plan, isSelected, onSelect }) => (
    <div 
        onClick={onSelect}
        className={`relative p-5 border-2 rounded-2xl shadow-sm bg-[var(--bg-secondary)] flex flex-col cursor-pointer transition-all duration-300 ${isSelected ? `border-[var(--accent-primary)] scale-105 shadow-lg ${plan.popular ? 'popular-plan-glow' : ''}` : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'}`}
    >
        {plan.popular && <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 text-xs font-semibold text-black bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full shadow-md">الأكثر شيوعًا</div>}
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
        <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">{plan.price}</p>
        <ul className="mt-4 space-y-2 flex-grow text-[var(--text-secondary)] text-sm">
            {plan.features.map((feature: string) => ( <li key={feature} className="flex items-start"><CheckCircleIcon className="w-4 h-4 text-green-500 ml-2 flex-shrink-0 mt-0.5" /><span>{feature}</span></li>))}
        </ul>
        <div className={`mt-5 w-full py-2.5 text-center rounded-lg font-bold text-sm transition-colors ${isSelected ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-accent)]'}`}>
            {isSelected ? 'تم الاختيار' : 'اختر الباقة'}
        </div>
    </div>
);


const StatusCard: React.FC<{
    status: 'active' | 'pending';
    itemName: string;
    plan: PlanName;
    endDate?: string;
    planName: string;
}> = ({ status, itemName, planName, endDate }) => {
    const isPending = status === 'pending';
    const Icon = isPending ? ClockIcon : CheckCircleIcon;
    const colorClass = isPending ? 'yellow' : 'green';
    const title = isPending ? 'تم استلام طلبك' : 'أنت مشترك بالفعل';
    const statusText = isPending ? 'قيد المراجعة' : 'نشط';
    const description = isPending ? 'سيتم تفعيل الاشتراك خلال 24 ساعة من تأكيد الدفع.' : `ينتهي في: ${endDate}`;

    return (
        <div className={`p-5 bg-[var(--bg-secondary)] rounded-xl shadow-lg border-t-4 border-${colorClass}-500 text-center`}>
            <Icon className={`w-14 h-14 text-${colorClass}-500 mx-auto mb-3`} />
            <h2 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">{title}</h2>
            <p className="text-[var(--text-secondary)] mb-3">{itemName}</p>
            <div className="flex flex-col items-center justify-center space-y-2">
                <p className="font-semibold text-lg text-[var(--text-primary)]">باقة {planName}</p>
                <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${colorClass}-100 text-${colorClass}-800`}>
                    {statusText}
                </div>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">{description}</p>
            </div>
        </div>
    );
};


const Subscription: React.FC<SubscriptionProps> = ({ user, targetUnit, onBackToSubjects }) => {
  const [view, setView] = useState<SubscriptionView>(targetUnit ? 'unit' : 'selection');
  
  // Form state
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Quarterly');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState(targetUnit?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [redemptionCode, setRedemptionCode] = useState('');
  
  const [dataVersion, setDataVersion] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    if (view === 'full') {
        setSelectedPlan('SemiAnnually');
    } else {
        setSelectedPlan('Quarterly');
    }
  }, [view]);

  // Data fetching
  const grade = useMemo(() => getGradeById(user.grade), [user.grade]);
  const units = useMemo(() => grade?.semesters.flatMap(s => s.units) || [], [grade]);
  const courses = useMemo(() => getFeaturedCourses(), []);
  
  const VODAFONE_CASH_NUMBER = '01012345678';
  
  const refreshData = () => setDataVersion(v => v + 1);

  // Memoize selected items for display and logic
  const selectedUnit = useMemo(() => units.find(u => u.id === selectedUnitId), [units, selectedUnitId]);
  const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);

  const activeSubscriptionForItem = useMemo(() => {
    let itemId: string | undefined;
    if (view === 'unit' && selectedUnit) itemId = selectedUnit.id;
    if (view === 'course' && selectedCourse) itemId = selectedCourse.id;
    if (view === 'full') itemId = 'full_platform_access';
    if (!itemId) return null;
    
    const subs = getSubscriptionsByUserId(user.id);
    return subs.find(s => s.itemId === itemId && s.status === 'Active');
  }, [user.id, view, selectedUnit, selectedCourse, dataVersion]);
  
  const pendingRequestForItem = useMemo(() => {
    let itemId: string | undefined;
    if (view === 'unit' && selectedUnit) itemId = selectedUnit.id;
    if (view === 'course' && selectedCourse) itemId = selectedCourse.id;
    if (view === 'full') itemId = 'full_platform_access';
    if (!itemId) return undefined;
    return getPendingSubscriptionRequestForItem(user.id, itemId);
  }, [user.id, view, selectedUnit, selectedCourse, dataVersion]);

  const unitPricingPlans = [
    { id: 'Monthly', name: 'شهري', price: '100 جنيه', features: ['الوصول إلى جميع الدروس', 'تصحيح الواجبات', 'امتحانات شهرية'] },
    { id: 'Quarterly', name: 'ربع سنوي', price: '250 جنيه', features: ['جميع ميزات الباقة الشهرية', 'دعم ذو أولوية', 'ملخصات قابلة للتنزيل'], popular: true },
    { id: 'Annual', name: 'سنوي', price: '800 جنيه', features: ['جميع ميزات الباقة الربع سنوية', 'وصول لمدة عام كامل', 'جلسات مراجعة حصرية'] },
  ];

  const platformPricingPlans = [
    { id: 'Monthly', name: 'شهري', price: '200 جنيه', features: ['وصول كامل لكل المواد', 'كل كورسات المنصة', 'دعم فني سريع'] },
    { id: 'SemiAnnually', name: 'نصف سنوي', price: '1000 جنيه', features: ['خصم ~17%', 'وصول كامل لكل المواد', 'كل كورسات المنصة', 'دعم فني سريع'], popular: true },
    { id: 'Annual', name: 'سنوي', price: '1800 جنيه', features: ['خصم ~25% (3 شهور مجاناً)', 'وصول كامل لكل المواد', 'كل كورسات المنصة', 'دعم فني سريع'] },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let requestData: { itemId: string; itemName: string; itemType: 'unit' | 'course' | 'platform', plan: PlanName } | null = null;
    
    if (view === 'unit' && selectedUnit) {
      requestData = { itemId: selectedUnit.id, itemName: selectedUnit.title, itemType: 'unit', plan: selectedPlan };
    } else if (view === 'course' && selectedCourse) {
      requestData = { itemId: selectedCourse.id, itemName: selectedCourse.title, itemType: 'course', plan: selectedPlan };
    } else if (view === 'full') {
      requestData = { itemId: 'full_platform_access', itemName: 'اشتراك شامل', itemType: 'platform', plan: selectedPlan };
    }

    if (!requestData) {
      addToast('الرجاء اختيار عنصر للاشتراك به.', ToastType.ERROR);
      return;
    }

    if (!paymentNumber.trim() || !/^(01[0-2,5])\d{8}$/.test(paymentNumber.trim())) {
      addToast('الرجاء إدخال رقم هاتف مصري صحيح.', ToastType.ERROR);
      return;
    }

    addSubscriptionRequest(user.id, user.name, requestData.plan, paymentNumber, requestData.itemId, requestData.itemName, requestData.itemType);
    refreshData();
    addToast('تم إرسال طلب الاشتراك بنجاح!', ToastType.SUCCESS);
  };
  
  const handleBackToSelection = () => {
    if(targetUnit) {
        onBackToSubjects();
    } else {
        setView('selection');
        setSelectedUnitId('');
        setSelectedCourseId('');
        setPaymentNumber('');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
  const translatePlanName = (plan: PlanName) => {
      const allPlans = [...unitPricingPlans, ...platformPricingPlans];
      return allPlans.find(p => p.id === plan)?.name || plan;
  };

  const handleRedeemCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!redemptionCode.trim()) return;
    const result = redeemPrepaidCode(redemptionCode, user.id);
    if (result.success) {
        addToast(result.message, ToastType.SUCCESS);
        setRedemptionCode('');
        refreshData();
    } else {
        addToast(result.message, ToastType.ERROR);
    }
  };


  const renderSubscriptionForm = (itemName: string, plansToShow: any[]) => (
      <>
        <div className="p-5 mb-6 bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)]">
          <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">خطوات الاشتراك</h2>
          <ol className="list-decimal list-inside space-y-3 text-[var(--text-secondary)]">
              <li>{'اختر الباقة المناسبة لك من الأسفل.'}</li>
              <li>قم بتحويل قيمة الاشتراك إلى رقم فودافون كاش التالي: <strong className="text-[var(--text-accent)] font-bold tracking-wider">{VODAFONE_CASH_NUMBER}</strong></li>
              <li>اكتب رقم الهاتف الذي قمت بالتحويل منه في الخانة المخصصة.</li>
              <li>اضغط على زر "إرسال طلب الاشتراك" وانتظر التفعيل.</li>
          </ol>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plansToShow.map(plan => (
            <PricingPlanCard key={plan.id} plan={plan} isSelected={selectedPlan === plan.id} onSelect={() => setSelectedPlan(plan.id as any)} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)]">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)]">تأكيد الاشتراك</h2>
            <p className="text-[var(--text-secondary)] mb-4">
                أنت على وشك طلب الاشتراك في <strong className="text-[var(--text-primary)]">{`باقة ${translatePlanName(selectedPlan)} لـ`}"{itemName}"</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <input type="tel" value={paymentNumber} onChange={(e) => setPaymentNumber(e.target.value)} placeholder="رقم الهاتف الذي تم التحويل منه" required className="flex-grow mt-1 block w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all placeholder-[var(--text-secondary)]" />
                <button type="submit" className="w-full sm:w-auto py-3 px-6 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50 transition-all duration-300 transform hover:scale-105 shadow-md">
                  إرسال طلب الاشتراك
                </button>
            </div>
        </form>
      </>
  );

  const renderContent = () => {
    if (activeSubscriptionForItem) {
        return <StatusCard status="active" itemName={activeSubscriptionForItem.itemName} plan={activeSubscriptionForItem.plan} planName={translatePlanName(activeSubscriptionForItem.plan)} endDate={formatDate(activeSubscriptionForItem.endDate)} />;
    }
    if (pendingRequestForItem) {
        return <StatusCard status="pending" itemName={pendingRequestForItem.itemName} plan={pendingRequestForItem.plan} planName={translatePlanName(pendingRequestForItem.plan)} />;
    }
    
    switch (view) {
        case 'selection':
            return (
                <div className="space-y-6">
                    <SubscriptionTypeCard title="اشتراك في مادة" description="اختر مادة محددة للاشتراك في محتواها بشكل منفصل." icon={BookOpenIcon} onClick={() => setView('unit')} />
                    <SubscriptionTypeCard title="شراء كورس" description="احصل على وصول كامل لكورسات المراجعة والمواد الإضافية." icon={VideoCameraIcon} onClick={() => setView('course')} />
                    <SubscriptionTypeCard title="الاشتراك الشامل" description="وصول غير محدود لجميع المواد والكورسات بباقات متنوعة." icon={SparklesIcon} onClick={() => setView('full')} />
                </div>
            );
            
        case 'unit':
            return (
              <div>
                {!targetUnit && (
                  <select value={selectedUnitId} onChange={e => setSelectedUnitId(e.target.value)} className="w-full p-3 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                    <option value="">-- اختر المادة --</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.title}</option>)}
                  </select>
                )}
                {selectedUnit && renderSubscriptionForm(selectedUnit.title, unitPricingPlans)}
              </div>
            );

        case 'course':
             return (
              <div>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full p-3 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                  <option value="">-- اختر الكورس --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                {selectedCourse && renderSubscriptionForm(selectedCourse.title, unitPricingPlans)}
              </div>
            );
            
        case 'full':
            return renderSubscriptionForm('الاشتراك الشامل', platformPricingPlans);
    }
  };

  return (
    <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">الاشتراك وتجديد الباقة</h1>
            {view !== 'selection' && (
                <button onClick={handleBackToSelection} className="flex items-center space-x-2 space-x-reverse text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>{targetUnit ? 'العودة للمادة' : 'العودة للخيارات'}</span>
                </button>
            )}
        </div>

        <div className="p-5 mb-8 bg-[var(--bg-secondary)] rounded-xl shadow-md border border-[var(--border-primary)]">
            <h2 className="text-2xl font-semibold mb-4 text-[var(--text-primary)] flex items-center space-x-2 space-x-reverse">
                <KeyIcon className="w-6 h-6 text-yellow-400"/>
                <span>هل لديك كود تفعيل؟</span>
            </h2>
            <p className="text-[var(--text-secondary)] mb-4">
                إذا حصلت على كود تفعيل من أحد المدرسين، يمكنك إدخاله هنا لتفعيل اشتراكك فورًا.
            </p>
            <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-4">
                <input 
                    type="text" 
                    value={redemptionCode} 
                    onChange={(e) => setRedemptionCode(e.target.value)} 
                    placeholder="xxxx-xxxx-xxxx" 
                    required 
                    className="flex-grow mt-1 block w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all placeholder-[var(--text-secondary)] font-mono tracking-widest text-center"
                    style={{direction: 'ltr'}}
                />
                <button type="submit" className="w-full sm:w-auto py-3 px-6 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50 transition-all duration-300 transform hover:scale-105 shadow-md">
                  تفعيل الكود
                </button>
            </form>
        </div>


        {renderContent()}
    </div>
  );
};

export default Subscription;
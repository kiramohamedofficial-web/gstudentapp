import React, { useState } from 'react';
import { StudentView, ToastType } from '../../types';
import { BookOpenIcon, VideoCameraIcon, SparklesIcon, ArrowRightIcon, QrcodeIcon } from '../common/Icons';
import { useSession } from '../../hooks/useSession';
import { useToast } from '../../useToast';
import { redeemCode } from '../../services/storageService';
import { useSubscription } from '../../hooks/useSubscription';

interface SubscriptionViewProps {
  onNavigate: (view: StudentView) => void;
}

const SubscriptionOptionCard: React.FC<{
    icon: React.FC<{ className?: string }>;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon: Icon, title, description, onClick }) => {
    return (
        <button
            onClick={onClick}
            className="w-full bg-[var(--bg-secondary)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--border-secondary)] transition-all duration-300 flex items-center justify-between text-right space-x-4 space-x-reverse group"
        >
            <div className="flex items-center space-x-5 space-x-reverse flex-1">
                 <div className="p-4 bg-[#2D2D30] rounded-xl group-hover:bg-[#3a3a3d] transition-colors">
                    <Icon className="w-8 h-8 text-purple-400" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
                </div>
            </div>
            
            <div className="p-3 bg-[var(--bg-tertiary)] rounded-full transition-transform duration-300 group-hover:translate-x-[-4px]">
                 <ArrowRightIcon className="w-6 h-6 text-[var(--text-secondary)]" />
            </div>
        </button>
    );
};


const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onNavigate }) => {
    const { currentUser } = useSession();
    const { refetchSubscription } = useSubscription();
    const { addToast } = useToast();
    const [code, setCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleRedeemCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim() || !currentUser) return;
        setIsRedeeming(true);

        const userGrade = currentUser.grade;
        const userTrack = currentUser.track;
        if (userGrade === null || !userTrack) {
            addToast('بيانات صفك الدراسي غير مكتملة. يرجى تحديث ملفك الشخصي أولاً.', ToastType.ERROR);
            setIsRedeeming(false);
            return;
        }

        const result = await redeemCode(code, userGrade, userTrack);

        if (result.success) {
            addToast('تم تفعيل اشتراكك بنجاح!', ToastType.SUCCESS);
            setCode('');
            await refetchSubscription();
        } else {
            addToast(result.error || 'فشل تفعيل الكود. يرجى التأكد من صحة الكود والمحاولة مرة أخرى.', ToastType.ERROR);
        }
        setIsRedeeming(false);
    };

    const options = [
        {
            icon: BookOpenIcon,
            title: "اشتراك في مادة",
            description: "اختر مادة محددة للاشتراك في محتواها بشكل منفصل.",
            view: 'singleSubjectSubscription' as StudentView
        },
        {
            icon: VideoCameraIcon,
            title: "شراء كورس",
            description: "احصل على وصول كامل لكورسات المراجعة والمواد الإضافية.",
            view: 'courses' as StudentView
        },
        {
            icon: SparklesIcon,
            title: "الاشتراك الشامل",
            description: "وصول غير محدود لجميع المواد والكورسات بباقات متنوعة.",
            view: 'comprehensiveSubscription' as StudentView
        }
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-black text-center mb-10 text-[var(--text-primary)]">
                الاشتراك وتجديد الباقة
            </h1>

            <div className="space-y-5">
                {options.map((option, index) => (
                     <div key={index} className="fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                        <SubscriptionOptionCard
                            icon={option.icon}
                            title={option.title}
                            description={option.description}
                            onClick={() => onNavigate(option.view)}
                        />
                    </div>
                ))}
            </div>
            
            <div className="mt-12 pt-8 border-t border-[var(--border-primary)]">
                <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-primary)]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-500/10 rounded-xl">
                            <QrcodeIcon className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">لديك كود اشتراك؟</h2>
                            <p className="text-[var(--text-secondary)] text-sm mt-1">أدخله هنا لتفعيل اشتراكك فوراً.</p>
                        </div>
                    </div>
                    <form onSubmit={handleRedeemCode} className="flex items-center gap-3 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] focus-within:ring-2 focus-within:ring-green-500 transition-all">
                        <input 
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="أدخل الكود هنا..."
                            className="flex-grow bg-transparent px-4 py-2 text-center text-lg tracking-widest border-none focus:ring-0 placeholder:text-sm placeholder:tracking-normal"
                        />
                        <button 
                            type="submit"
                            disabled={isRedeeming || !code.trim()}
                            className="px-6 py-2.5 font-bold text-white bg-green-600 rounded-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRedeeming ? 'جاري...' : 'تفعيل'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionView;
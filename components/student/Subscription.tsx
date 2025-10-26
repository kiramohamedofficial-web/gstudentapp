import React from 'react';
import { User, StudentView } from '../../types';
import { BookOpenIcon, VideoCameraIcon, SparklesIcon, ArrowRightIcon } from '../common/Icons';

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
        </div>
    );
};

export default SubscriptionView;

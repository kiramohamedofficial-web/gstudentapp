import React, { useState, useEffect, useCallback } from 'react';
import { PlatformSettings, ToastType } from '../../types';
import { getPlatformSettings } from '../../services/storageService';
import { CurrencyDollarIcon, CreditCardIcon, CogIcon } from '../common/Icons';
import Loader from '../common/Loader';

const PriceDisplay: React.FC<{ label: string; value: number; currency: string; }> = ({ label, value, currency }) => (
    <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
        <div className="text-2xl font-bold text-[var(--text-primary)]">
            {value} <span className="text-base font-semibold text-[var(--text-secondary)]">{currency}</span>
        </div>
    </div>
);

const SubscriptionPriceControlView: React.FC = () => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const data = await getPlatformSettings();
            setSettings(data);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    if (isLoading || !settings) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الاشتراكات</h1>
                <p className="text-[var(--text-secondary)] mt-1">عرض أسعار الباقات، أرقام الدفع، وأنواع الاشتراكات المتاحة.</p>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CogIcon className="w-6 h-6 text-purple-400" />
                    أنواع الاشتراكات المتاحة
                </h2>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] opacity-70">
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">الاشتراك الشامل</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">يسمح للطلاب بالوصول لكل المحتوى.</p>
                    </div>
                     <span className={`px-3 py-1 text-xs font-semibold rounded-full ${settings.enabledSubscriptionModes?.includes('comprehensive') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {settings.enabledSubscriptionModes?.includes('comprehensive') ? 'مفعل' : 'معطل'}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)] opacity-70">
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">اشتراك المادة الواحدة</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">يسمح للطلاب بالاشتراك في مواد منفصلة.</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${settings.enabledSubscriptionModes?.includes('singleSubject') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {settings.enabledSubscriptionModes?.includes('singleSubject') ? 'مفعل' : 'معطل'}
                    </span>
                </div>
            </div>


            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] space-y-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
                    أسعار الاشتراكات
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PriceDisplay label="الباقة الشهرية" value={settings.monthlyPrice} currency={settings.currency || 'EGP'} />
                    <PriceDisplay label="الباقة الربع سنوية (3 أشهر)" value={settings.quarterlyPrice} currency={settings.currency || 'EGP'} />
                    <PriceDisplay label="الباقة النصف سنوية (6 أشهر)" value={settings.semiAnnuallyPrice} currency={settings.currency || 'EGP'} />
                    <PriceDisplay label="الباقة السنوية" value={settings.annualPrice} currency={settings.currency || 'EGP'} />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رمز العملة</label>
                    <p className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg font-semibold text-lg">{settings.currency || 'EGP'}</p>
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-purple-400" />
                    أرقام الدفع
                </h2>
                 <div>
                    <div className="space-y-2">
                        {settings.paymentNumbers && settings.paymentNumbers.length > 0 && (
                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                                <p className="text-xs text-[var(--text-secondary)]">الرقم الأساسي</p>
                                <p className="text-lg font-bold tracking-wider">{settings.paymentNumbers[0]}</p>
                            </div>
                        )}
                        {settings.paymentNumbers && settings.paymentNumbers.length > 1 && (
                            <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                                <p className="text-xs text-[var(--text-secondary)]">الرقم الثانوي</p>
                                <p className="text-lg font-bold tracking-wider">{settings.paymentNumbers[1]}</p>
                            </div>
                        )}
                         {(!settings.paymentNumbers || settings.paymentNumbers.length === 0) && (
                             <p className="text-[var(--text-secondary)]">لم يتم تحديد أرقام دفع.</p>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionPriceControlView;

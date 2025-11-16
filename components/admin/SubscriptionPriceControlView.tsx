
import React, { useState, useEffect, useCallback } from 'react';
import { PlatformSettings, ToastType } from '../../types';
import { getPlatformSettings, updatePlatformSettings } from '../../services/storageService';
import { CurrencyDollarIcon, CreditCardIcon, CogIcon } from '../common/Icons';
import Loader from '../common/Loader';
import { useToast } from '../../useToast';

const PriceDisplay: React.FC<{ label: string; value: number; currency: string; }> = ({ label, value, currency }) => (
    <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg border border-[var(--border-primary)]">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
        <div className="text-2xl font-bold text-[var(--text-primary)]">
            {value} <span className="text-base font-semibold text-[var(--text-secondary)]">{currency}</span>
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${enabled ? 'bg-purple-600' : 'bg-[var(--bg-tertiary)]'}`}
        role="switch"
        aria-checked={enabled}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
    </button>
);

const SubscriptionPriceControlView: React.FC = () => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const data = await getPlatformSettings();
            setSettings(data);
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const handleSubscriptionModeChange = useCallback((mode: 'comprehensive' | 'singleSubject', enabled: boolean) => {
        setSettings(prev => {
            if (!prev) return null;
            const currentModes = prev.enabledSubscriptionModes || [];
            let newModes: ('comprehensive' | 'singleSubject')[];
            if (enabled) {
                newModes = [...new Set([...currentModes, mode])];
            } else {
                newModes = currentModes.filter(m => m !== mode);
            }
            return { ...prev, enabledSubscriptionModes: newModes };
        });
        setIsDirty(true);
    }, []);
    
    const handleSave = async () => {
        if (settings) {
            setIsSaving(true);
            const { error } = await updatePlatformSettings(settings);
            if (error) {
                addToast(`فشل حفظ الإعدادات: ${error.message}`, ToastType.ERROR);
            } else {
                addToast('تم حفظ الإعدادات بنجاح!', ToastType.SUCCESS);
                setIsDirty(false);
            }
            setIsSaving(false);
        }
    };


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
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">تفعيل الاشتراك الشامل</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">السماح للطلاب بالاشتراك في الباقة الشاملة.</p>
                    </div>
                     <ToggleSwitch 
                        enabled={(settings.enabledSubscriptionModes ?? ['comprehensive', 'singleSubject']).includes('comprehensive')}
                        onChange={(enabled) => handleSubscriptionModeChange('comprehensive', enabled)}
                    />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">تفعيل اشتراك المادة الواحدة</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">السماح للطلاب بالاشتراك في مواد منفصلة.</p>
                    </div>
                    <ToggleSwitch 
                        enabled={(settings.enabledSubscriptionModes ?? ['comprehensive', 'singleSubject']).includes('singleSubject')}
                        onChange={(enabled) => handleSubscriptionModeChange('singleSubject', enabled)}
                    />
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
            {isDirty && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto fade-in-up">
                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-xl shadow-2xl border border-[var(--border-primary)] flex items-center gap-4">
                        <p className="text-sm text-[var(--text-secondary)]">لديك تغييرات غير محفوظة.</p>
                        <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
                            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPriceControlView;

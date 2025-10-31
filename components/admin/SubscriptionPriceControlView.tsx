import React, { useState, useEffect, useCallback } from 'react';
import { PlatformSettings, ToastType } from '../../types';
import { getPlatformSettings, updatePlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import { CurrencyDollarIcon, CreditCardIcon, CogIcon } from '../common/Icons';
import Loader from '../common/Loader';

const PriceInput: React.FC<{ label: string; name: keyof PlatformSettings; value: number; currency: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, name, value, currency, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
        <div className="relative">
            <input type="number" id={name} name={name} value={value} onChange={onChange} className="w-full p-3 pr-20 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--text-secondary)]">{currency}</span>
        </div>
    </div>
);

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button type="button" onClick={() => onChange(!enabled)} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${enabled ? 'bg-purple-600' : 'bg-[var(--bg-tertiary)]'}`} role="switch" aria-checked={enabled}>
        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`}/>
    </button>
);


const SubscriptionPriceControlView: React.FC = () => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => {
            if (!prev) return null;
            const key = name as keyof PlatformSettings;

            if (key === 'paymentNumbers') {
                return { ...prev, paymentNumbers: value.split(',').map(s => s.trim()).filter(Boolean) };
            }
            if (key === 'currency') {
                return { ...prev, currency: value.toUpperCase() };
            }
            if (['monthlyPrice', 'quarterlyPrice', 'semiAnnuallyPrice', 'annualPrice'].includes(key)) {
                return { ...prev, [key]: Number(value) };
            }
            return prev; // Should not happen with current form
        });
    }, []);
    
    const handleModeToggle = useCallback((mode: 'comprehensive' | 'singleSubject', isEnabled: boolean) => {
        setSettings(prev => {
            if (!prev) return null;
            const currentModes = prev.enabledSubscriptionModes || ['comprehensive', 'singleSubject'];
            let newModes: ('comprehensive' | 'singleSubject')[];
            if (isEnabled) {
                newModes = [...new Set([...currentModes, mode])];
            } else {
                newModes = currentModes.filter(m => m !== mode);
            }
            return { ...prev, enabledSubscriptionModes: newModes };
        });
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        const { error } = await updatePlatformSettings(settings);
        setIsSaving(false);
        if (error) {
            addToast(`فشل حفظ الإعدادات: ${error.message}`, ToastType.ERROR);
        } else {
            addToast('تم حفظ إعدادات الاشتراكات بنجاح!', ToastType.SUCCESS);
        }
    };

    if (isLoading || !settings) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الاشتراكات</h1>
                <p className="text-[var(--text-secondary)] mt-1">التحكم في أسعار الباقات، أرقام الدفع، وأنواع الاشتراكات المتاحة.</p>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] space-y-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CogIcon className="w-6 h-6 text-purple-400" />
                    أنواع الاشتراكات المتاحة
                </h2>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">الاشتراك الشامل</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">يسمح للطلاب بالوصول لكل المحتوى.</p>
                    </div>
                    <ToggleSwitch
                        enabled={settings.enabledSubscriptionModes?.includes('comprehensive') ?? true}
                        onChange={(enabled) => handleModeToggle('comprehensive', enabled)}
                    />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                    <div>
                        <h3 className="font-semibold text-[var(--text-primary)]">اشتراك المادة الواحدة</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">يسمح للطلاب بالاشتراك في مواد منفصلة.</p>
                    </div>
                    <ToggleSwitch
                        enabled={settings.enabledSubscriptionModes?.includes('singleSubject') ?? true}
                        onChange={(enabled) => handleModeToggle('singleSubject', enabled)}
                    />
                </div>
            </div>


            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] space-y-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
                    أسعار الاشتراكات
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PriceInput label="الباقة الشهرية" name="monthlyPrice" value={settings.monthlyPrice} onChange={handleChange} currency={settings.currency || 'EGP'} />
                    <PriceInput label="الباقة الربع سنوية (3 أشهر)" name="quarterlyPrice" value={settings.quarterlyPrice} onChange={handleChange} currency={settings.currency || 'EGP'} />
                    <PriceInput label="الباقة النصف سنوية (6 أشهر)" name="semiAnnuallyPrice" value={settings.semiAnnuallyPrice} onChange={handleChange} currency={settings.currency || 'EGP'} />
                    <PriceInput label="الباقة السنوية" name="annualPrice" value={settings.annualPrice} onChange={handleChange} currency={settings.currency || 'EGP'} />
                </div>
                 <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رمز العملة</label>
                    <input 
                        type="text" 
                        id="currency" 
                        name="currency"
                        placeholder="EGP"
                        value={settings.currency || ''} 
                        onChange={handleChange} 
                        className="w-full md:w-1/2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400" 
                        maxLength={3}
                    />
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-purple-400" />
                    أرقام الدفع
                </h2>
                <div>
                    <label htmlFor="paymentNumbers" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">أرقام الدفع (مفصولة بفاصلة)</label>
                    <input 
                        type="text" 
                        id="paymentNumbers" 
                        name="paymentNumbers"
                        placeholder="01234567890, 01098765432"
                        value={(settings.paymentNumbers || []).join(', ')} 
                        onChange={handleChange} 
                        className="w-full md:w-1/2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400" 
                    />
                </div>
            </div>
            
            <div className="flex justify-end">
                 <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60">
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionPriceControlView;
import React, { useState, useEffect, useCallback } from 'react';
import { PlatformSettings, ToastType } from '../../types';
import { getPlatformSettings, updatePlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import { CurrencyDollarIcon, CreditCardIcon } from '../common/Icons';
import Loader from '../common/Loader';

const PriceInput: React.FC<{ label: string; name: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
        <div className="relative">
            <input type="number" id={name} name={name} value={value} onChange={onChange} className="w-full p-3 pr-12 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)]">ج.م</span>
        </div>
    </div>
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

    const handleChange = useCallback((section: 'comprehensive' | 'singleSubject' | 'paymentNumbers', key: string, value: string | number) => {
        setSettings(prev => {
            if (!prev) return null;
            if (section === 'paymentNumbers') {
                return {
                    ...prev,
                    paymentNumbers: {
                        ...prev.paymentNumbers,
                        [key]: value
                    }
                }
            }
            return {
                ...prev,
                subscriptionPrices: {
                    ...prev.subscriptionPrices,
                    [section]: {
                        ...prev.subscriptionPrices[section],
                        [key]: Number(value)
                    }
                }
            };
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
            addToast('تم حفظ إعدادات الأسعار بنجاح!', ToastType.SUCCESS);
        }
    };

    if (isLoading || !settings) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    const { comprehensive, singleSubject } = settings.subscriptionPrices;
    const { vodafoneCash } = settings.paymentNumbers;

    return (
        <div className="fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة أسعار الاشتراكات</h1>
                <p className="text-[var(--text-secondary)] mt-1">التحكم في أسعار الباقات وأرقام الدفع التي تظهر للطلاب.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] space-y-6">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                        <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
                        أسعار الاشتراك الشامل
                    </h2>
                    <PriceInput label="الباقة الشهرية" name="monthly" value={comprehensive.monthly} onChange={e => handleChange('comprehensive', 'monthly', e.target.value)} />
                    <PriceInput label="الباقة الربع سنوية (3 أشهر)" name="quarterly" value={comprehensive.quarterly} onChange={e => handleChange('comprehensive', 'quarterly', e.target.value)} />
                    <PriceInput label="الباقة السنوية" name="annual" value={comprehensive.annual} onChange={e => handleChange('comprehensive', 'annual', e.target.value)} />
                </div>
                <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)] space-y-6">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                        <CurrencyDollarIcon className="w-6 h-6 text-purple-400" />
                        أسعار اشتراك المادة الواحدة
                    </h2>
                    <PriceInput label="الباقة الشهرية" name="monthly" value={singleSubject.monthly} onChange={e => handleChange('singleSubject', 'monthly', e.target.value)} />
                    <PriceInput label="الباقة النصف سنوية (6 أشهر)" name="semiAnnually" value={singleSubject.semiAnnually} onChange={e => handleChange('singleSubject', 'semiAnnually', e.target.value)} />
                    <PriceInput label="الباقة السنوية" name="annually" value={singleSubject.annually} onChange={e => handleChange('singleSubject', 'annually', e.target.value)} />
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-4 flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-purple-400" />
                    طرق الدفع
                </h2>
                <div>
                    <label htmlFor="vodafoneCash" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">رقم فودافون كاش</label>
                    <input type="tel" id="vodafoneCash" name="vodafoneCash" value={vodafoneCash} onChange={e => handleChange('paymentNumbers', 'vodafoneCash', e.target.value)} className="w-full md:w-1/2 p-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400" />
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
import React, { useState, useEffect, useCallback } from 'react';
import { User, PlatformSettings, ToastType } from '../../types';
import { getPlatformSettings, updatePlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import { TemplateIcon, SparklesIcon, CogIcon, PhotoIcon, SpeakerphoneIcon } from '../common/Icons';
import ImageUpload from '../common/ImageUpload';

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border-primary)]">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const TextInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
        <input type="text" id={name} name={name} value={value} onChange={onChange} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400"/>
    </div>
);

const TextArea: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; }> = ({ label, name, value, onChange, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
        <textarea id={name} name={name} value={value} onChange={onChange} rows={rows} className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400"/>
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

interface PlatformSettingsViewProps {
  user: User;
}

type SettingsTab = 'hero' | 'features' | 'footer' | 'branding' | 'announcements';

const PlatformSettingsView: React.FC<PlatformSettingsViewProps> = ({ user }) => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('announcements');
    const { addToast } = useToast();

    const tabs: { id: SettingsTab; label: string; icon: React.FC<{className?:string}> }[] = [
        { id: 'announcements', label: 'الإعلانات', icon: SpeakerphoneIcon },
        { id: 'hero', label: 'الواجهة الرئيسية', icon: TemplateIcon },
        { id: 'branding', label: 'الصور والعلامة', icon: PhotoIcon },
        { id: 'features', label: 'قسم المميزات', icon: SparklesIcon },
        { id: 'footer', label: 'التذييل', icon: CogIcon },
    ];

    useEffect(() => {
        getPlatformSettings().then(fetchedSettings => {
            setSettings(fetchedSettings);
            setIsLoading(false);
        });
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
        setIsDirty(true);
    }, []);
    
    const handleBannerChange = useCallback((field: 'text' | 'subtitle' | 'imageUrl' | 'enabled', value: string | boolean) => {
        setSettings(prev => {
            if (!prev) return null;
            const banner = prev.announcementBanner || { text: '', subtitle: '', imageUrl: '', enabled: false };
            return { ...prev, announcementBanner: { ...banner, [field]: value }};
        });
        setIsDirty(true);
    }, []);

    const handleFeatureChange = useCallback((index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => {
            if (!prev) return null;
            const newFeatures = [...prev.features];
            newFeatures[index] = { ...newFeatures[index], [name]: value };
            return { ...prev, features: newFeatures };
        });
        setIsDirty(true);
    }, []);

    const handleSave = () => {
        if (settings) {
            updatePlatformSettings(settings);
            addToast('تم حفظ الإعدادات بنجاح!', ToastType.SUCCESS);
            setIsDirty(false);
        }
    };

    if (isLoading || !settings) {
        return <div>جاري تحميل الإعدادات...</div>;
    }

    const renderContent = () => {
        switch(activeTab) {
            case 'hero':
                return (
                    <FormSection title="الواجهة الرئيسية (Hero Section)">
                        <TextInput label="اسم المنصة" name="platformName" value={settings.platformName} onChange={handleInputChange} />
                        <TextInput label="العنوان الرئيسي" name="heroTitle" value={settings.heroTitle} onChange={handleInputChange} />
                        <TextArea label="النص الفرعي" name="heroSubtitle" value={settings.heroSubtitle} onChange={handleInputChange} />
                        <TextInput label="نص الزر الرئيسي" name="heroButtonText" value={settings.heroButtonText} onChange={handleInputChange} />
                    </FormSection>
                );
            case 'announcements':
                return (
                    <FormSection title="شريط الإعلانات العلوي">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-tertiary)]">
                            <div>
                                <h3 className="font-semibold text-[var(--text-primary)]">تفعيل شريط الإعلانات</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1">إظهار شريط إعلاني أعلى الصفحة الرئيسية للطالب.</p>
                            </div>
                            <ToggleSwitch 
                                enabled={settings.announcementBanner?.enabled ?? false} 
                                onChange={(enabled) => handleBannerChange('enabled', enabled)}
                            />
                        </div>
                        {settings.announcementBanner?.enabled && (
                             <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]">
                                <TextInput 
                                    label="العنوان الرئيسي للإعلان" 
                                    name="announcementText" 
                                    value={settings.announcementBanner?.text || ''} 
                                    onChange={(e) => handleBannerChange('text', e.target.value)}
                                />
                                <TextInput 
                                    label="النص الفرعي للإعلان (اختياري)" 
                                    name="announcementSubtitle" 
                                    value={settings.announcementBanner?.subtitle || ''} 
                                    onChange={(e) => handleBannerChange('subtitle', e.target.value)}
                                />
                                <ImageUpload
                                    label="صورة الإعلان (اختياري)"
                                    value={settings.announcementBanner?.imageUrl || ''}
                                    onChange={(value) => handleBannerChange('imageUrl', value)}
                                />
                            </div>
                        )}
                    </FormSection>
                );
            case 'branding':
                return (
                    <FormSection title="إدارة الصور والعلامة التجارية">
                        <div className="space-y-6">
                            <ImageUpload
                                label="صورة الواجهة الرئيسية"
                                value={settings.heroImageUrl || ''}
                                onChange={(value) => {
                                    setSettings(prev => prev ? { ...prev, heroImageUrl: value } : null);
                                    setIsDirty(true);
                                }}
                            />
                            <ImageUpload
                                label="الصورة الافتراضية للمدرس"
                                value={settings.teacherImageUrl || ''}
                                onChange={(value) => {
                                    setSettings(prev => prev ? { ...prev, teacherImageUrl: value } : null);
                                    setIsDirty(true);
                                }}
                            />
                        </div>
                    </FormSection>
                );
            case 'features':
                return (
                     <FormSection title="قسم المميزات (Features)">
                        <TextInput label="عنوان القسم" name="featuresTitle" value={settings.featuresTitle} onChange={handleInputChange} />
                        <TextArea label="النص الفرعي للقسم" name="featuresSubtitle" value={settings.featuresSubtitle} onChange={handleInputChange} />
                        {settings.features.map((feature, index) => (
                            <div key={index} className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
                                <h3 className="font-semibold mb-2 text-md text-[var(--text-secondary)]">الميزة رقم {index + 1}</h3>
                                <div className="space-y-2">
                                    <TextInput label="عنوان الميزة" name="title" value={feature.title} onChange={(e) => handleFeatureChange(index, e)} />
                                    <TextArea label="وصف الميزة" name="description" value={feature.description} onChange={(e) => handleFeatureChange(index, e)} rows={2} />
                                </div>
                            </div>
                        ))}
                    </FormSection>
                );
            case 'footer':
                 return (
                    <FormSection title="التذييل (Footer)">
                        <TextArea label="وصف المنصة في التذييل" name="footerDescription" value={settings.footerDescription} onChange={handleInputChange} />
                        <TextInput label="رقم الهاتف للتواصل" name="contactPhone" value={settings.contactPhone} onChange={handleInputChange} />
                        <TextInput label="رابط صفحة الفيسبوك" name="contactFacebookUrl" value={settings.contactFacebookUrl} onChange={handleInputChange} />
                        <TextInput label="رابط قناة اليوتيوب" name="contactYoutubeUrl" value={settings.contactYoutubeUrl} onChange={handleInputChange} />
                    </FormSection>
                );
            default: return null;
        }
    }

    return (
        <div className="h-full flex flex-col fade-in">
            <h1 className="flex-shrink-0 text-3xl font-bold text-[var(--text-primary)] mb-6">إعدادات المنصة</h1>
            
            <div className="flex-grow flex flex-col md:flex-row gap-8 overflow-hidden">
                <aside className="md:w-56 flex-shrink-0">
                     <nav className="flex flex-row md:flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 space-x-reverse p-3 text-sm font-semibold transition-colors duration-200 rounded-lg text-right
                                ${activeTab === tab.id ? 'bg-[var(--bg-tertiary)] text-purple-400' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'}`}
                            >
                               <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-purple-400' : ''}`}/>
                               <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-8 fade-in" key={activeTab}>
                       {renderContent()}
                    </div>
                </main>
            </div>
            {isDirty && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-auto fade-in-up">
                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-xl shadow-2xl border border-[var(--border-primary)] flex items-center gap-4">
                        <p className="text-sm text-[var(--text-secondary)]">لديك تغييرات غير محفوظة.</p>
                         <button onClick={handleSave} className="px-5 py-2 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">حفظ</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlatformSettingsView;
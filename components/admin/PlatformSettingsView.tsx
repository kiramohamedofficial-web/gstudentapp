import React, { useState, useEffect, useCallback } from 'react';
import { User, PlatformSettings, ToastType } from '../../types';
import { getPlatformSettings, updatePlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import { UserCircleIcon, TemplateIcon, SparklesIcon, CogIcon } from '../common/Icons';


const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border-primary)]">{title}</h2>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const TextInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400"
        />
    </div>
);

const TextArea: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; }> = ({ label, name, value, onChange, rows = 3 }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-[var(--text-secondary)] mb-2">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            className="w-full p-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-purple-400"
        />
    </div>
);

interface PlatformSettingsViewProps {
  user: User;
}

type SettingsTab = 'profile' | 'hero' | 'features' | 'footer' | 'branding';

const PlatformSettingsView: React.FC<PlatformSettingsViewProps> = ({ user }) => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [activeTab, setActiveTab] = useState<SettingsTab>('hero');
    const { addToast } = useToast();

    const tabs: { id: SettingsTab; label: string; icon: React.FC<{className?:string}> }[] = [
        { id: 'profile', label: 'ملف المدير', icon: UserCircleIcon },
        { id: 'hero', label: 'الواجهة الرئيسية', icon: TemplateIcon },
        { id: 'branding', label: 'العلامة التجارية', icon: SparklesIcon },
        { id: 'features', label: 'قسم المميزات', icon: SparklesIcon },
        { id: 'footer', label: 'التذييل', icon: CogIcon },
    ];

    useEffect(() => {
        setSettings(getPlatformSettings());
        setIsLoading(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'heroImageUrl' | 'teacherImageUrl') => {
        const file = e.target.files?.[0];
        if (file) {
             if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                addToast('حجم الصورة يجب ألا يتجاوز 2 ميجابايت.', ToastType.ERROR);
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings(prev => prev ? { ...prev, [field]: reader.result as string } : null);
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    }

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
            case 'profile':
                return (
                    <FormSection title="ملف المدير الشخصي">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-lg font-bold text-[var(--text-primary)]">{user.name}</p>
                                <p className="text-[var(--text-secondary)]">المدير</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">لا توجد إعدادات أخرى للملف الشخصي حاليًا.</p>
                    </FormSection>
                );
            case 'hero':
                return (
                    <FormSection title="الواجهة الرئيسية (Hero Section)">
                        <TextInput label="اسم المنصة (في الهيدر)" name="platformName" value={settings.platformName} onChange={handleInputChange} />
                        <TextInput label="العنوان الرئيسي" name="heroTitle" value={settings.heroTitle} onChange={handleInputChange} />
                        <TextArea label="النص الفرعي" name="heroSubtitle" value={settings.heroSubtitle} onChange={handleInputChange} />
                        <TextInput label="نص الزر الرئيسي" name="heroButtonText" value={settings.heroButtonText} onChange={handleInputChange} />
                    </FormSection>
                );
            case 'branding':
                return (
                    <FormSection title="إدارة الصور والعلامة التجارية">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">صورة الواجهة الرئيسية</label>
                                {settings.heroImageUrl && <img src={settings.heroImageUrl} alt="معاينة الواجهة" className="w-auto h-40 object-cover rounded-lg border border-[var(--border-primary)] mb-2" />}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'heroImageUrl')} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">الصورة الافتراضية للمدرس</label>
                                {settings.teacherImageUrl && <img src={settings.teacherImageUrl} alt="معاينة المدرس" className="w-24 h-24 object-cover rounded-full border border-[var(--border-primary)] mb-2" />}
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'teacherImageUrl')} className="w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                            </div>
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
            default:
                return null;
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex justify-between items-center mb-6 pb-4 border-b border-[var(--border-primary)]">
                 <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">إعدادات المنصة</h1>
                  <button
                    onClick={handleSave}
                    disabled={!isDirty}
                    className="px-6 py-2.5 font-bold text-white bg-purple-600 rounded-lg 
                               hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50
                               transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    حفظ التغييرات
                </button>
            </div>
            
            <div className="flex-grow flex flex-col md:flex-row gap-8 overflow-hidden">
                {/* Right Navigation */}
                <aside className="md:w-64 flex-shrink-0">
                     <nav className="flex flex-row md:flex-col gap-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 space-x-reverse p-3 text-sm font-semibold transition-colors duration-200 rounded-lg text-right
                                ${activeTab === tab.id ? 'bg-[var(--bg-tertiary)] text-purple-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50'}`}
                            >
                               <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-purple-500' : ''}`}/>
                               <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Left Content */}
                <main className="flex-1 overflow-y-auto pr-2 -mr-2">
                    <div className="space-y-8 fade-in" key={activeTab}>
                       {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PlatformSettingsView;

import React, { useState, useEffect, useCallback } from 'react';
import { PlatformSettings, ToastType, IconSettings } from '../../types';
import { getPlatformSettings, updatePlatformSettings } from '../../services/storageService';
import { useToast } from '../../useToast';
import { SparklesIcon, PhotoIcon } from '../common/Icons';
import ImageUpload from '../common/ImageUpload';
import Loader from '../common/Loader';

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 pb-4 border-b border-[var(--border-primary)] flex items-center gap-3">
            <PhotoIcon className="w-6 h-6 text-purple-400" />
            {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children}
        </div>
    </div>
);

const IconSettingsView: React.FC = () => {
    const [settings, setSettings] = useState<PlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        getPlatformSettings().then(fetchedSettings => {
            setSettings(fetchedSettings);
            setIsLoading(false);
        });
    }, []);

    const handleIconChange = useCallback((field: keyof IconSettings, value: string) => {
        setSettings(prev => {
            if (!prev) return null;
            return {
                ...prev,
                iconSettings: {
                    ...prev.iconSettings,
                    [field]: value,
                }
            };
        });
        setIsDirty(true);
    }, []);

    const handleSave = async () => {
        if (settings) {
            setIsSaving(true);
            const { error } = await updatePlatformSettings(settings);
            setIsSaving(false);
            if (error) {
                addToast(`فشل حفظ الإعدادات: ${error.message}`, ToastType.ERROR);
            } else {
                addToast('تم حفظ إعدادات الأيقونات بنجاح! سيتم تحديث الصفحة.', ToastType.SUCCESS);
                setIsDirty(false);
                setTimeout(() => window.location.reload(), 1500);
            }
        }
    };

    if (isLoading || !settings) {
        return <div className="flex justify-center items-center h-64"><Loader /></div>;
    }

    const iconSettings = settings.iconSettings || {};

    return (
        <div className="h-full flex flex-col fade-in">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الأيقونات والشعار</h1>
                <p className="text-[var(--text-secondary)] mt-1 mb-8">تخصيص الهوية البصرية للمنصة بالكامل.</p>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8">
                <FormSection title="العلامة التجارية الرئيسية">
                    <ImageUpload label="أيقونة المتصفح (Favicon)" value={iconSettings.faviconUrl || ''} onChange={v => handleIconChange('faviconUrl', v)} />
                    <ImageUpload label="شعار المنصة الرئيسي (للرأس)" value={iconSettings.mainLogoUrl || ''} onChange={v => handleIconChange('mainLogoUrl', v)} />
                </FormSection>
                
                <FormSection title="أيقونات شاشة الترحيب">
                    <ImageUpload label="صورة البطل (Hero)" value={iconSettings.welcomeHeroImageUrl || ''} onChange={v => handleIconChange('welcomeHeroImageUrl', v)} />
                    <ImageUpload label="أيقونة (طالب مسجل)" value={iconSettings.welcomeStatStudentIconUrl || ''} onChange={v => handleIconChange('welcomeStatStudentIconUrl', v)} />
                    <ImageUpload label="أيقونة (درس تفاعلي)" value={iconSettings.welcomeStatLessonIconUrl || ''} onChange={v => handleIconChange('welcomeStatLessonIconUrl', v)} />
                    <ImageUpload label="أيقونة (معدل الرضا)" value={iconSettings.welcomeStatSatisfactionIconUrl || ''} onChange={v => handleIconChange('welcomeStatSatisfactionIconUrl', v)} />
                    <ImageUpload label="أيقونة (دعم مستمر)" value={iconSettings.welcomeStatSupportIconUrl || ''} onChange={v => handleIconChange('welcomeStatSupportIconUrl', v)} />
                    <ImageUpload label="أيقونة ميزة (الإحصائيات)" value={iconSettings.welcomeFeatureStatsIconUrl || ''} onChange={v => handleIconChange('welcomeFeatureStatsIconUrl', v)} />
                    <ImageUpload label="أيقونة ميزة (مشغل الفيديو)" value={iconSettings.welcomeFeaturePlayerIconUrl || ''} onChange={v => handleIconChange('welcomeFeaturePlayerIconUrl', v)} />
                    <ImageUpload label="أيقونة ميزة (المساعد الذكي)" value={iconSettings.welcomeFeatureAiIconUrl || ''} onChange={v => handleIconChange('welcomeFeatureAiIconUrl', v)} />
                </FormSection>

                <FormSection title="أيقونات لوحة الطالب">
                    <ImageUpload label="التنقل: الرئيسية" value={iconSettings.studentNavHomeIconUrl || ''} onChange={v => handleIconChange('studentNavHomeIconUrl', v)} />
                    <ImageUpload label="التنقل: المنهج" value={iconSettings.studentNavCurriculumIconUrl || ''} onChange={v => handleIconChange('studentNavCurriculumIconUrl', v)} />
                    <ImageUpload label="التنقل: ريلز" value={iconSettings.studentNavReelsIconUrl || ''} onChange={v => handleIconChange('studentNavReelsIconUrl', v)} />
                    <ImageUpload label="التنقل: الاشتراك" value={iconSettings.studentNavSubscriptionIconUrl || ''} onChange={v => handleIconChange('studentNavSubscriptionIconUrl', v)} />
                    <ImageUpload label="التنقل: ملفي" value={iconSettings.studentNavProfileIconUrl || ''} onChange={v => handleIconChange('studentNavProfileIconUrl', v)} />
                    <ImageUpload label="التنقل: النتائج" value={iconSettings.studentNavResultsIconUrl || ''} onChange={v => handleIconChange('studentNavResultsIconUrl', v)} />
                    <ImageUpload label="التنقل: المساعد الذكي" value={iconSettings.studentNavChatbotIconUrl || ''} onChange={v => handleIconChange('studentNavChatbotIconUrl', v)} />
                    <ImageUpload label="التنقل: أفلام كرتون" value={iconSettings.studentNavCartoonIconUrl || ''} onChange={v => handleIconChange('studentNavCartoonIconUrl', v)} />
                    <ImageUpload label="التنقل: بنك الأسئلة" value={iconSettings.studentNavQuestionBankIconUrl || ''} onChange={v => handleIconChange('studentNavQuestionBankIconUrl', v)} />
                </FormSection>

                 <FormSection title="أيقونات لوحة التحكم">
                    <ImageUpload label="التنقل: إدارة المحتوى" value={iconSettings.adminNavContentIconUrl || ''} onChange={v => handleIconChange('adminNavContentIconUrl', v)} />
                    <ImageUpload label="التنقل: إدارة المدرسين" value={iconSettings.adminNavTeacherIconUrl || ''} onChange={v => handleIconChange('adminNavTeacherIconUrl', v)} />
                    <ImageUpload label="التنقل: إدارة الطلاب" value={iconSettings.adminNavStudentIconUrl || ''} onChange={v => handleIconChange('adminNavStudentIconUrl', v)} />
                    <ImageUpload label="التنقل: فحص الأعطال" value={iconSettings.adminNavHealthIconUrl || ''} onChange={v => handleIconChange('adminNavHealthIconUrl', v)} />
                    <ImageUpload label="التنقل: أفلام كرتون" value={iconSettings.adminNavCartoonIconUrl || ''} onChange={v => handleIconChange('adminNavCartoonIconUrl', v)} />
                </FormSection>
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

export default IconSettingsView;

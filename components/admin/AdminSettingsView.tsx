import React, { useState, useCallback, useEffect } from 'react';
import { User, ToastType } from '../../types';
// FIX: Replaced missing PaletteIcon with TemplateIcon which is available and used for theming.
import { LogoutIcon, KeyIcon, TemplateIcon, ArrowsExpandIcon, ArrowsShrinkIcon, CogIcon, SparklesIcon, VideoCameraIcon, SunIcon, MoonIcon, CheckIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import { useSession } from '../../hooks/useSession';
import { useAppearance } from '../../App';

const ChangePasswordModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { addToast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addToast("تم تغيير كلمة المرور بنجاح (محاكاة).", ToastType.SUCCESS);
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="تغيير كلمة المرور">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور الحالية</label>
                    <input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور الجديدة</label>
                    <input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">تأكيد كلمة المرور الجديدة</label>
                    <input type="password" required className="w-full p-2 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border-primary)]" />
                </div>
                <div className="flex justify-end pt-4">
                    <button type="submit" className="px-5 py-2 font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700">حفظ التغييرات</button>
                </div>
            </form>
        </Modal>
    );
};

// NOTE: This component is duplicated from Profile.tsx due to file structure constraints.
// In a real project, this would be a shared component.
const AppearanceSettings: React.FC<{}> = () => {
    // This component will contain all the new UI for theme customization
    return (
        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <TemplateIcon className="w-6 h-6 text-purple-400"/>
                إعدادات المظهر
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
                هذه الإعدادات متقدمة وتسمح بتخصيص دقيق. حاليًا هي واجهة للعرض فقط.
            </p>

            <div className="space-y-6">
                {/* Neon Mode Section */}
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-cyan-400"/>
                            وضع النيون
                        </h4>
                        {/* <ToggleSwitch enabled={false} onChange={() => {}} /> */}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                        سيتم تفعيل هذه الميزة قريبًا لإضافة تأثيرات توهج وحدود مضيئة للواجهة.
                    </p>
                </div>

                {/* Color Customization Section */}
                <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)] space-y-4">
                     <h4 className="font-semibold text-lg flex items-center gap-2">
                        <TemplateIcon className="w-5 h-5 text-pink-400"/>
                        تخصيص الألوان
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                        سيتم تفعيل هذه الميزة قريبًا لتغيير الألوان الأساسية للتطبيق لكل وضع على حدة.
                    </p>
                </div>
            </div>
        </div>
    );
};


const AdminSettingsView: React.FC = () => {
  const { currentUser: user, handleLogout: onLogout } = useSession();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleFullscreenChange]);

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
      } else if (document.exitFullscreen) {
          document.exitFullscreen();
      }
  };

  if (!user) return null;

  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold text-[var(--text-primary)]">إعدادات الحساب</h1>
      <p className="mt-1 text-[var(--text-secondary)] mb-8">إدارة ملفك الشخصي، وتخصيص المظهر، والتحكم في أمان حسابك.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">الملف الشخصي</h2>
                <div className="flex flex-col items-center text-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-4xl mb-4 shadow-lg">{user.name.charAt(0)}</div>
                    <p className="text-xl font-bold text-[var(--text-primary)]">{user.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                    <span className="mt-3 px-3 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400">المدير العام</span>
                </div>
            </div>

            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">إجراءات الحساب</h2>
                <div className="space-y-3">
                    <button onClick={toggleFullscreen} className="w-full flex items-center justify-between p-3 rounded-lg text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors duration-200 group">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            {isFullscreen ? <ArrowsShrinkIcon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-purple-400 transition-colors" /> : <ArrowsExpandIcon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-purple-400 transition-colors" />}
                            <span>{isFullscreen ? 'الخروج من وضع ملء الشاشة' : 'عرض ملء الشاشة'}</span>
                        </div>
                    </button>
                    <button onClick={() => setIsPasswordModalOpen(true)} className="w-full flex items-center justify-between p-3 rounded-lg text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors duration-200 group">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <KeyIcon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-purple-400 transition-colors" />
                            <span>تغيير كلمة المرور</span>
                        </div>
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center justify-between p-3 rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors duration-200 group">
                         <div className="flex items-center space-x-3 space-x-reverse">
                            <LogoutIcon className="w-5 h-5" />
                            <span>تسجيل الخروج</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
            <AppearanceSettings />
        </div>
      </div>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
};

export default AdminSettingsView;
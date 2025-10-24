import React, { useState } from 'react';
import { User, Theme, ToastType } from '../../types';
import { LogoutIcon, KeyIcon, TemplateIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';
import ThemeSelectionModal from '../common/ThemeSelectionModal';

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


interface AdminSettingsViewProps {
  user: User;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onLogout: () => void;
}

const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ user, theme, setTheme, onLogout }) => {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

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
            <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <TemplateIcon className="w-6 h-6 text-purple-400"/>
                    خصص مظهر لوحة التحكم
                </h2>
                <p className="text-[var(--text-secondary)] mb-8">اختر السمة التي تناسب ذوقك وتريح عينيك أثناء العمل.</p>
                <button onClick={() => setIsThemeModalOpen(true)} className="w-full flex items-center justify-center p-4 rounded-lg text-[var(--text-primary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] transition-colors duration-200 space-x-3 space-x-reverse text-lg">
                    <TemplateIcon className="w-6 h-6 text-purple-400" />
                    <span>فتح قائمة السمات</span>
                </button>
            </div>
        </div>
      </div>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <ThemeSelectionModal 
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        setTheme={setTheme}
      />
    </div>
  );
};

export default AdminSettingsView;
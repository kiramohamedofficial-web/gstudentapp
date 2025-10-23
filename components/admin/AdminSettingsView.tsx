import React, { useState } from 'react';
import { User, Theme, ToastType } from '../../types';
import { THEMES } from '../../constants';
import { LogoutIcon, KeyIcon } from '../common/Icons';
import { useToast } from '../../useToast';
import Modal from '../common/Modal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="fade-in">
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إعدادات الحساب</h1>
      
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">الملف الشخصي</h2>
            <div className="flex items-center space-x-4 space-x-reverse">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">{user.name.charAt(0)}</div>
                <div>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{user.name}</p>
                    <p className="text-[var(--text-secondary)]">المدير</p>
                </div>
            </div>
        </div>
        
        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">تغيير السمة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} title={t.name} className={`p-1.5 rounded-lg transition-all duration-300 ${theme === t.id ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--accent-primary)]' : ''}`}>
                      {t.id === 'dark' && <div className="w-full h-20 rounded-md bg-[#141414] flex items-center justify-center text-white border border-white/10"><span>{t.name}</span></div>}
                      {t.id === 'light' && <div className="w-full h-20 rounded-md bg-gray-100 flex items-center justify-center text-black border border-black/10"><span>{t.name}</span></div>}
                      {t.id === 'gold' && <div className="w-full h-20 rounded-md bg-[#1F1C19] flex items-center justify-center text-[#F0E6D8] border border-[#D4AF37]/20"><span>{t.name}</span></div>}
                      {t.id === 'pink' && <div className="w-full h-20 rounded-md bg-[#231923] flex items-center justify-center text-[#FCE7F3] border border-[#EC4899]/20"><span>{t.name}</span></div>}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">الأمان</h2>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">كلمة المرور</h3>
                    <p className="text-sm text-[var(--text-secondary)]">يوصى بتغيير كلمة المرور بشكل دوري.</p>
                </div>
                 <button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center space-x-2 space-x-reverse px-4 py-2 text-sm font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/40 rounded-lg transition-colors">
                    <KeyIcon className="w-4 h-4" />
                    <span>تغيير</span>
                </button>
            </div>
        </div>
        
        <div className="text-center pt-4">
            <button onClick={onLogout} className="inline-flex items-center justify-center space-x-3 space-x-reverse px-6 py-3 font-semibold rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200">
                <LogoutIcon className="w-5 h-5" />
                <span>تسجيل الخروج</span>
            </button>
        </div>
      </div>
      <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default AdminSettingsView;

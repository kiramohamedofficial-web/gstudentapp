
import React from 'react';
import { User, Theme } from '../../types';
import { THEMES } from '../../constants';

interface AdminSettingsViewProps {
  user: User;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onLogout: () => void;
}

const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ user, theme, setTheme, onLogout }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إعدادات الحساب</h1>
      
      <div className="bg-[var(--bg-primary)] p-6 rounded-xl shadow-lg border border-[var(--border-primary)]">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">الملف الشخصي</h2>
        <div className="flex items-center space-x-4 space-x-reverse">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl">
                {user.name.charAt(0)}
            </div>
            <div>
                <p className="text-lg font-bold text-[var(--text-primary)]">{user.name}</p>
                <p className="text-[var(--text-secondary)]">المدير</p>
            </div>
        </div>

        <div className="border-t border-[var(--border-primary)] my-8"></div>

        <div className="mb-6">
            <label className="block text-md font-medium text-[var(--text-secondary)] mb-3">تغيير السمة</label>
            <div className="flex flex-wrap gap-4">
                {THEMES.map(t => (
                    <button key={t.id} onClick={() => setTheme(t.id)} title={t.name} className={`w-24 h-16 rounded-lg flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105 ${theme === t.id ? 'ring-2 ring-[var(--accent-primary)]' : 'ring-1 ring-inset ring-[var(--border-primary)]'}`}>
                      {t.id === 'dark' && <div className="w-full h-full rounded-md bg-gray-800 flex items-center justify-center text-white"><span>{t.name}</span></div>}
                      {t.id === 'light' && <div className="w-full h-full rounded-md bg-gray-100 flex items-center justify-center text-black"><span>{t.name}</span></div>}
                      {t.id === 'gold' && <div className="w-full h-full rounded-md bg-yellow-100 flex items-center justify-center text-yellow-900"><span>{t.name}</span></div>}
                      {t.id === 'pink' && <div className="w-full h-full rounded-md bg-pink-100 flex items-center justify-center text-pink-900"><span>{t.name}</span></div>}
                    </button>
                ))}
            </div>
        </div>

        <div className="border-t border-[var(--border-primary)] my-8"></div>

        <div>
            <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-3">تسجيل الخروج</h3>
            <button
                onClick={onLogout}
                className="w-full md:w-auto px-6 py-3 text-sm font-bold text-white bg-red-600/90 hover:bg-red-600 rounded-lg transition-colors duration-200"
            >
                تسجيل الخروج من لوحة التحكم
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsView;

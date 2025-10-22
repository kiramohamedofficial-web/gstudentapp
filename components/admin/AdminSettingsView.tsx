import React from 'react';
import { User } from '../../types';
import { UserCircleIcon, KeyIcon } from '../common/Icons';

const AccountSettingsView: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">إعدادات الحساب</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="settings-card">
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
        </div>

        <div className="settings-card">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">الأمان</h2>
           <button className="w-full flex items-center justify-center p-3 rounded-lg text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] transition-colors duration-200 space-x-3 space-x-reverse">
              <KeyIcon className="w-5 h-5" />
              <span>تغيير كلمة المرور (غير مفعل)</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsView;

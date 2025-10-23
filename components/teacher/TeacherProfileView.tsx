import React from 'react';
import { User, Teacher } from '../../types';
import { LogoutIcon } from '../common/Icons';

interface TeacherProfileViewProps {
  user: User;
  teacher: Teacher;
  onLogout: () => void;
}

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ user, teacher, onLogout }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">ملفي الشخصي</h1>
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <div className="flex flex-col items-center text-center">
                <img src={teacher.imageUrl} alt={teacher.name} className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-[var(--bg-tertiary)]"/>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{teacher.name}</h2>
                <p className="text-[var(--text-secondary)]">{teacher.subject}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-[var(--border-primary)] space-y-2 text-sm">
                <p className="flex justify-between"><strong>رقم الهاتف:</strong> <span className="text-[var(--text-secondary)]">{user.phone}</span></p>
                <p className="flex justify-between"><strong>البريد الإلكتروني:</strong> <span className="text-[var(--text-secondary)]">{user.email || 'لم يحدد'}</span></p>
            </div>
        </div>
        
        <div className="text-center pt-8">
            <button onClick={onLogout} className="inline-flex items-center justify-center space-x-3 space-x-reverse px-6 py-3 font-semibold rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200">
                <LogoutIcon className="w-5 h-5" />
                <span>تسجيل الخروج</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileView;
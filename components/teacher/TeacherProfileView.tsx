import React, { useState, useCallback, useEffect } from 'react';
import { User, Teacher } from '../../types';
import { LogoutIcon, ArrowsExpandIcon, ArrowsShrinkIcon } from '../common/Icons';

interface TeacherProfileViewProps {
  user: User;
  teacher: Teacher;
  onLogout: () => void;
}

const TeacherProfileView: React.FC<TeacherProfileViewProps> = ({ user, teacher, onLogout }) => {
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">ملفي الشخصي</h1>
      <div className="max-w-2xl mx-auto space-y-8">
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
        
        <div className="bg-[var(--bg-secondary)] p-6 rounded-xl shadow-md border border-[var(--border-primary)]">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">إجراءات الحساب</h2>
            <div className="space-y-3">
                <button onClick={toggleFullscreen} className="w-full flex items-center justify-center p-3 rounded-lg text-[var(--text-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] transition-colors duration-200 space-x-3 space-x-reverse">
                    {isFullscreen ? <ArrowsShrinkIcon className="w-5 h-5" /> : <ArrowsExpandIcon className="w-5 h-5" />}
                    <span>{isFullscreen ? 'الخروج من وضع ملء الشاشة' : 'عرض ملء الشاشة'}</span>
                </button>
                <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 space-x-3 space-x-reverse">
                    <LogoutIcon className="w-5 h-5" />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileView;
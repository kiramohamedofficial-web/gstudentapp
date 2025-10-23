import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon } from './Icons';

const ScreenSecurity: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const warningText = 'لأسباب تتعلق بحقوق الملكية الفكرية وحماية المحتوى، تم تعطيل تصوير الشاشة والنسخ والطباعة.';

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Basic check for PrintScreen key
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Attempt to clear clipboard
        e.preventDefault();
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 3000);
      }
      
      // Common screenshot shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
        navigator.clipboard.writeText('');
        setIsBlocked(true);
        setTimeout(() => setIsBlocked(false), 3000);
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  return (
    <div className="relative secure-content h-full w-full">
      {isBlocked && (
        <div 
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center text-white text-center p-8 fade-in" 
            role="alert" 
            aria-live="assertive"
        >
          <div className="max-w-md">
            <ShieldCheckIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">تم حظر الإجراء</h2>
            <p className="text-lg text-gray-300">{warningText}</p>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default ScreenSecurity;
import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon } from './Icons';

const ScreenSecurity: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScreenshotBlocked, setIsScreenshotBlocked] = useState(false);
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  
  const screenshotWarningText = 'لأسباب تتعلق بحقوق الملكية الفكرية وحماية المحتوى، تم تعطيل تصوير الشاشة والنسخ والطباعة.';
  const devToolsWarningText = 'أدوات المطورين غير مسموح بها في هذه المنصة. يرجى إغلاقها لمتابعة التصفح.';

  useEffect(() => {
    // --- Basic Protections ---
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handleDragStart = (e: DragEvent) => e.preventDefault();

    // --- Screenshot Detection ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || ((e.metaKey || e.ctrlKey) && e.shiftKey)) {
        navigator.clipboard.writeText(''); // Attempt to clear clipboard
        e.preventDefault();
        setIsScreenshotBlocked(true);
        setTimeout(() => setIsScreenshotBlocked(false), 3000);
      }
    };
    
    // --- DevTools Detection ---
    const checkDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;

        if (widthThreshold || heightThreshold) {
            setIsDevToolsOpen(true);
        } else {
            setIsDevToolsOpen(false);
        }
    };

    // --- Event Listeners ---
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    document.addEventListener('dragstart', handleDragStart);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', checkDevTools);

    // --- Interval Checks ---
    const devToolsInterval = setInterval(checkDevTools, 1000);
    // This debugger trap makes it very annoying to use the debugger.
    const debuggerInterval = setInterval(() => {
        try {
            // A trick to detect if debugger is open and pause execution.
            (function() { return false; }
                .constructor('debugger')
                .call('action'));
        } catch(e) {}
    }, 1500);

    // Initial check
    checkDevTools();

    // Cleanup on component unmount
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      document.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkDevTools);
      clearInterval(devToolsInterval);
      clearInterval(debuggerInterval);
    };
  }, []);
  
  return (
    <div className="relative secure-content">
      {isScreenshotBlocked && (
        <div 
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-sm flex items-center justify-center text-white text-center p-8 fade-in" 
            role="alert" 
            aria-live="assertive"
        >
          <div className="max-w-md">
            <ShieldCheckIcon className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">تم حظر الإجراء</h2>
            <p className="text-lg text-gray-300">{screenshotWarningText}</p>
          </div>
        </div>
      )}

      {isDevToolsOpen && (
        <div 
            className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-md flex items-center justify-center text-white text-center p-8" 
            role="alert" 
            aria-live="assertive"
        >
            <div className="max-w-lg">
                <ShieldCheckIcon className="w-24 h-24 text-red-600 mx-auto mb-8 animate-pulse" />
                <h2 className="text-4xl font-black mb-4">تم اكتشاف أدوات المطورين</h2>
                <p className="text-xl text-gray-300">{devToolsWarningText}</p>
            </div>
        </div>
      )}

      {children}
    </div>
  );
};

export default ScreenSecurity;

import React, { useState } from 'react';
import { BookBookmarkIcon, ArrowRightIcon, UserCircleIcon, KeyIcon, QrcodeIcon } from '../common/Icons';

interface LoginScreenProps {
  onLogin: (identifier: string, password: string) => void;
  onCodeLogin: (code: string) => void;
  error: string;
  onBack: () => void;
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCodeLogin, error, onBack, onNavigateToRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isCodeLogin, setIsCodeLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCodeLogin) {
        onCodeLogin(code);
    } else {
        onLogin(identifier, password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden cosmic-flow-background">
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 space-x-reverse text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 group"
      >
        <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
        <span>العودة للرئيسية</span>
      </button>

      <div 
        className="relative z-10 p-8 space-y-8 w-full max-w-md bg-[rgba(var(--bg-secondary-rgb),0.6)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl"
      >
        <div className="text-center fade-in flex flex-col items-center">
          <div className="p-4 bg-[rgba(var(--bg-primary-rgb),0.5)] rounded-full mb-4 border-2 border-[var(--border-primary)]">
            {isCodeLogin ? <QrcodeIcon className="w-10 h-10 text-green-400" /> : <BookBookmarkIcon className="w-10 h-10 text-[var(--accent-secondary)]" />}
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {isCodeLogin ? 'تفعيل الاشتراك' : 'تسجيل الدخول'}
          </h1>
          <p className="text-[var(--text-secondary)] mt-3">
            {isCodeLogin ? 'أدخل كود الاشتراك الذي حصلت عليه.' : 'مرحباً بعودتك! أدخل بياناتك للمتابعة.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-5 fade-in fade-in-delay-1">
          {isCodeLogin ? (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كود الاشتراك</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <QrcodeIcon className="w-5 h-5 text-gray-500"/>
                  </div>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="block w-full px-4 py-3 pr-10 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                    placeholder="أدخل الكود هنا"
                  />
                </div>
              </div>
          ) : (
            <>
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">رقم الهاتف أو البريد الإلكتروني</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <UserCircleIcon className="w-5 h-5 text-gray-500"/>
                  </div>
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="block w-full px-4 py-3 pr-10 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all duration-300"
                    placeholder="أدخل رقم هاتفك أو بريدك الإلكتروني"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <KeyIcon className="w-5 h-5 text-gray-500"/>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full px-4 py-3 pr-10 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all duration-300"
                    placeholder="أدخل كلمة المرور"
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" 
            className={`w-full py-3.5 px-4 font-bold text-white rounded-lg 
                       focus:outline-none focus:ring-4
                       transition-all duration-300 transform hover:scale-105 shadow-lg 
                       ${isCodeLogin 
                         ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500/50 shadow-green-500/20' 
                         : 'bg-[var(--accent-primary)] hover:brightness-110 focus:ring-[rgba(var(--accent-primary-rgb),0.5)] shadow-[0_10px_20px_-10px_rgba(var(--accent-primary-rgb),0.4)]'
                       }`}
          >
            {isCodeLogin ? 'متابعة' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="w-full pt-6 border-t border-[var(--border-primary)] text-center fade-in fade-in-delay-2">
            <p className="text-sm text-[var(--text-secondary)]">
                {isCodeLogin ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
                <button 
                    onClick={isCodeLogin ? () => setIsCodeLogin(false) : onNavigateToRegister}
                    className="font-semibold text-[var(--accent-secondary)] hover:brightness-125 transition-all duration-300 mr-2"
                >
                    {isCodeLogin ? 'تسجيل الدخول بكلمة المرور' : 'إنشاء حساب جديد'}
                </button>
            </p>
            {!isCodeLogin && (
                 <p className="text-sm text-[var(--text-secondary)] mt-2">
                    أو
                    <button 
                        onClick={() => setIsCodeLogin(true)}
                        className="font-semibold text-green-400 hover:text-green-300 transition-colors duration-300 mr-2"
                    >
                        تسجيل الدخول بكود اشتراك
                    </button>
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
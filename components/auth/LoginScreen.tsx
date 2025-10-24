import React, { useState } from 'react';
import { ArrowRightIcon, UserCircleIcon, KeyIcon, QrcodeIcon } from '../common/Icons';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onCodeLogin: (code: string) => void;
  error: string;
  onBack: () => void;
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCodeLogin, error, onBack, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isCodeLogin, setIsCodeLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (isCodeLogin) {
        onCodeLogin(code);
    } else {
        await onLogin(email, password);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 relative overflow-hidden cosmic-flow-background">
      <button 
        onClick={onBack}
        className="absolute top-6 right-6 z-20 flex items-center space-x-2 space-x-reverse text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 group"
      >
        <span>العودة للرئيسية</span>
        <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </button>

      <div 
        className="relative z-10 p-8 space-y-6 w-full max-w-md bg-[rgba(var(--bg-secondary-rgb),0.6)] backdrop-blur-lg border border-[var(--border-primary)] rounded-2xl shadow-2xl"
      >
        <div className="text-center fade-in flex flex-col items-center">
          <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mb-4 border-2 border-white/10 p-1">
            <video 
              src="https://k.top4top.io/m_35833aj8j0.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <h1 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            تسجيل الدخول
          </h1>
          <p className="text-[var(--text-secondary)] mt-3 max-w-xs mx-auto">
            مرحباً بعودتك! أدخل بياناتك للمتابعة.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-5 fade-in fade-in-delay-1">
          {isCodeLogin ? (
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كود الاشتراك</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <QrcodeIcon className="w-5 h-5 text-gray-400"/>
                  </div>
                  <input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="block w-full px-4 py-3 pl-10 text-right bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300"
                    placeholder="أدخل الكود هنا"
                  />
                </div>
              </div>
          ) : (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <UserCircleIcon className="w-5 h-5 text-gray-400"/>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full px-4 py-3 pl-10 text-right bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all duration-300"
                    placeholder="أدخل بريدك الإلكتروني"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">كلمة المرور</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <KeyIcon className="w-5 h-5 text-gray-400"/>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full px-4 py-3 pl-10 text-right bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all duration-300"
                    placeholder="أدخل كلمة المرور"
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-red-400 text-sm text-center pt-2">{error}</p>}
          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 px-4 font-bold text-white rounded-lg 
                       focus:outline-none focus:ring-4
                       transition-all duration-300 transform hover:scale-[1.03]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       ${isCodeLogin 
                         ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500/50 shadow-lg shadow-green-500/20' 
                         : 'bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 focus:ring-indigo-500/50 shadow-lg shadow-indigo-500/30'
                       }`}
          >
            {isLoading ? 'جاري التحقق...' : (isCodeLogin ? 'متابعة' : 'تسجيل الدخول')}
          </button>
        </form>

        <div className="w-full pt-6 border-t border-[var(--border-primary)] text-center fade-in fade-in-delay-2 space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
                {isCodeLogin ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
                <button 
                    onClick={isCodeLogin ? () => setIsCodeLogin(false) : onNavigateToRegister}
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300 mr-2"
                >
                    {isCodeLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                </button>
            </p>
            {!isCodeLogin && (
                 <p className="text-sm text-[var(--text-secondary)]">
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
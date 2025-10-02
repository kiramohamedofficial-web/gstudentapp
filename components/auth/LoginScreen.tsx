
import React, { useState } from 'react';
import { BookBookmarkIcon, ArrowRightIcon } from '../common/Icons';
import { DEMO_ADMIN_CODE, DEMO_ADMIN_USERNAME, DEMO_STUDENT_CODE, DEMO_STUDENT_USERNAME } from '../../constants';

const CosmicFlowBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 cosmic-flow-background">
            <div id="stars"></div>
            <div id="stars2"></div>
        </div>
    );
};

interface LoginScreenProps {
  onLogin: (identifier: string, code: string) => void;
  error: string;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error, onBack }) => {
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, code);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen text-white overflow-hidden p-4">
      <CosmicFlowBackground />
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 space-x-reverse text-slate-300 hover:text-white transition-colors duration-200 group"
      >
        <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
        <span>العودة للرئيسية</span>
      </button>
      <div 
        className="login-form-container relative z-10 flex flex-col items-center p-6 md:p-10 space-y-8 w-full max-w-md
                  bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-500/10
                  transition-all duration-500 ease-in-out"
      >
        <div className="text-center fade-in flex flex-col items-center">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full mb-4 border border-white/10">
            <BookBookmarkIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ background: 'linear-gradient(120deg, #58a6ff, #3fb950)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            تسجيل الدخول
          </h1>
          <p className="text-slate-300 mt-3 text-sm md:text-base">مرحباً بعودتك! أدخل بياناتك للمتابعة.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-5 fade-in fade-in-delay-1">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-slate-400 mb-2">الاسم أو البريد الإلكتروني</label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 placeholder-slate-500 glow-on-focus"
              placeholder="مثال: طالب تجريبي أو example@mail.com"
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-400 mb-2">كود الدخول</label>
            <input
              id="code"
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 placeholder-slate-500 glow-on-focus"
              placeholder="أدخل الكود الخاص بك"
            />
          </div>
          {error && <p className="text-red-400 text-sm animate-pulse">{error}</p>}
          <button 
            type="submit" 
            className="w-full py-3.5 px-4 font-bold text-white bg-gradient-to-r from-blue-600 to-green-500 rounded-lg 
                       hover:from-blue-700 hover:to-green-600 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                       transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/40 pulse-btn"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="w-full pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-4 fade-in fade-in-delay-2">
            <button 
                onClick={() => onLogin(DEMO_STUDENT_USERNAME, DEMO_STUDENT_CODE)}
                className="w-full py-2 px-4 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
                دخول تجريبي (طالب)
            </button>
            <button 
                onClick={() => onLogin(DEMO_ADMIN_USERNAME, DEMO_ADMIN_CODE)}
                className="w-full py-2 px-4 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
                دخول تجريبي (مدير)
            </button>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
import React, { useState } from 'react';
import { AtomIcon } from '../common/Icons';

const CosmicFlowBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 cosmic-flow-background">
            <div id="stars"></div>
            <div id="stars2"></div>
        </div>
    );
};

const LoginScreen: React.FC<{ onLogin: (username: string, code: string) => void; error: string; }> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, code);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen text-white overflow-hidden p-4">
      <CosmicFlowBackground />
      <div 
        className="relative z-10 flex flex-col items-center p-6 md:p-10 space-y-8 w-full max-w-md
                  bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl shadow-blue-500/10
                  transition-all duration-500 ease-in-out"
      >
        <div className="text-center fade-in flex flex-col items-center">
          <div className="p-4 bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full mb-4 border border-white/10">
            <AtomIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight" style={{ background: 'linear-gradient(120deg, #58a6ff, #3fb950)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            دكتور أحمد صابر
          </h1>
          <p className="text-slate-300 mt-3 text-sm md:text-base">مرحباً بك في فصلك الدراسي الرقمي للعلوم</p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-5 fade-in fade-in-delay-1">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-400 mb-2">الاسم الكامل</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 block w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 placeholder-slate-500 glow-on-focus"
              placeholder="مثال: عمر أحمد"
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
                onClick={() => onLogin('Omar Ahmed', '1234')}
                className="w-full py-2 px-4 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
                دخول تجريبي (طالب)
            </button>
            <button 
                onClick={() => onLogin('Dr. Ahmed Saber', 'admin')}
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
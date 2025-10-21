import React, { useState } from 'react';
import { BookBookmarkIcon, ArrowRightIcon, UserCircleIcon, KeyIcon } from '../common/Icons';

interface LoginScreenProps {
  onLogin: (identifier: string, password: string) => void;
  error: string;
  onBack: () => void;
  onNavigateToRegister: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error, onBack, onNavigateToRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111827] text-gray-200 p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-blob"></div>
      <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>

      <button 
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center space-x-2 space-x-reverse text-gray-400 hover:text-white transition-colors duration-200 group"
      >
        <ArrowRightIcon className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
        <span>العودة للرئيسية</span>
      </button>

      <div 
        className="relative z-10 p-8 space-y-8 w-full max-w-md bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-2xl"
      >
        <div className="text-center fade-in flex flex-col items-center">
          <div className="p-4 bg-gray-700/50 rounded-full mb-4 border-2 border-gray-600">
            <BookBookmarkIcon className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            تسجيل الدخول
          </h1>
          <p className="text-gray-400 mt-3">مرحباً بعودتك! أدخل بياناتك للمتابعة.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="w-full space-y-5 fade-in fade-in-delay-1">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-400 mb-2">رقم الهاتف أو البريد الإلكتروني</label>
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
                className="block w-full px-4 py-3 pr-10 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="أدخل رقم هاتفك أو بريدك الإلكتروني"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">كلمة المرور</label>
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
                className="block w-full px-4 py-3 pr-10 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                placeholder="أدخل كلمة المرور"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button 
            type="submit" 
            className="w-full py-3.5 px-4 font-bold text-white bg-blue-600 rounded-lg 
                       hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                       transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20"
          >
            تسجيل الدخول
          </button>
        </form>

        <div className="w-full pt-6 border-t border-gray-700 text-center fade-in fade-in-delay-2">
            <p className="text-sm text-gray-400">
                ليس لديك حساب؟
                <button 
                    onClick={onNavigateToRegister}
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300 mr-2"
                >
                    إنشاء حساب جديد
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, UserCircleIcon, KeyIcon } from '../common/Icons';
import AuthCharacter from './AuthCharacter';
import { validatePrepaidCode } from '../../services/storageService';
import Loader from '../common/Loader';

type CharacterState = 'idle' | 'watching' | 'lookingAway' | 'error';
type LoginType = 'credentials' | 'code';

interface LoginScreenProps {
  onLogin: (identifier: string, password: string) => void;
  error: string;
  onBack: () => void;
  onNavigateToRegister: (code?: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error, onBack, onNavigateToRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loginType, setLoginType] = useState<LoginType>('credentials');
  const [authError, setAuthError] = useState('');
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAuthError(error);
  }, [error]);

  useEffect(() => {
    if (authError) {
      setCharacterState('error');
    } else if (characterState === 'error') {
      setCharacterState('idle');
    }
  }, [authError, characterState]);


  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifier, password);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setIsLoading(true);
    setAuthError('');
    // Simulate a slight delay for better UX
    setTimeout(() => {
      const result = validatePrepaidCode(code);
      setIsLoading(false);
      if (result.success) {
        onNavigateToRegister(code);
      } else {
        setAuthError(result.message);
      }
    }, 500);
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
        className="relative z-10 w-full max-w-md bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center fade-in flex flex-col items-center mb-6">
          <AuthCharacter state={characterState} />
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-4">
            {loginType === 'credentials' ? 'تسجيل الدخول' : 'تفعيل حساب'}
          </h1>
          <p className="text-gray-400 mt-3">
            {loginType === 'credentials' ? 'مرحباً بعودتك! أدخل بياناتك للمتابعة.' : 'أدخل كود التفعيل لإنشاء حسابك.'}
          </p>
        </div>

        <div className="flex p-1 bg-gray-700/50 rounded-lg mb-6 fade-in fade-in-delay-1">
          <button
            onClick={() => { setLoginType('credentials'); setAuthError(''); }}
            className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${
              loginType === 'credentials' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-600/50'
            }`}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => { setLoginType('code'); setAuthError(''); }}
            className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${
              loginType === 'code' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-600/50'
            }`}
          >
            تفعيل كود
          </button>
        </div>
        
        {loginType === 'credentials' && (
          <form onSubmit={handleCredentialSubmit} className="w-full space-y-5 fade-in">
            <div>
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
                  placeholder="رقم الهاتف أو البريد الإلكتروني"
                  onFocus={() => setCharacterState('watching')}
                  onBlur={() => setCharacterState('idle')}
                />
              </div>
            </div>
            <div>
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
                  placeholder="كلمة المرور"
                  onFocus={() => setCharacterState('lookingAway')}
                  onBlur={() => setCharacterState('idle')}
                />
              </div>
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button 
              type="submit" 
              className="w-full py-3.5 px-4 font-bold text-white bg-blue-600 rounded-lg 
                        hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/50
                        transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              تسجيل الدخول
            </button>
          </form>
        )}

        {loginType === 'code' && (
          <form onSubmit={handleCodeSubmit} className="w-full space-y-5 fade-in">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <KeyIcon className="w-5 h-5 text-gray-500"/>
                </div>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="block w-full px-4 py-3 pr-10 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 font-mono tracking-widest text-center"
                  placeholder="xxxx-xxxx-xxxx"
                  style={{ direction: 'ltr' }}
                  onFocus={() => setCharacterState('watching')}
                  onBlur={() => setCharacterState('idle')}
                />
              </div>
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 px-4 font-bold text-white bg-green-600 rounded-lg 
                         hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500/50
                         transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/20
                         disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? <Loader /> : 'متابعة'}
            </button>
          </form>
        )}

        <div className="w-full pt-6 mt-6 border-t border-gray-700 text-center fade-in fade-in-delay-2">
            <p className="text-sm text-gray-400">
                {loginType === 'credentials' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                <button 
                    onClick={() => loginType === 'credentials' ? onNavigateToRegister() : setLoginType('credentials')}
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-300 mr-2"
                >
                    {loginType === 'credentials' ? 'إنشاء حساب جديد' : 'سجل الدخول'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
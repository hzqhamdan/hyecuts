import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Globe } from 'lucide-react';
import { api } from '../api/client';
import { API_URL } from '../config';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SmokeyBackground } from '../components/ui/login-form';

const CustomShieldIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 256 256" 
    fill="currentColor" 
    className={className}
  >
    <path d="M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z" />
  </svg>
);

export default function LoginScreen() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [username, setUsername] = useState('');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    void i18n.changeLanguage(newLang);
  };
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isRegistering ? '/auth/register' : '/auth/login';

    void (async () => {
      try {
        const data = await api.post<{ token: string; userId: string; role: string }>(endpoint, {
          body: { username, password }
        });
        login(data.token, data.userId, data.role, username);
        if (data.role === 'ROLE_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/lounge');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication failed';
        console.error("Login failed:", message);
        setError('Network error or server unreachable');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen text-black dark:text-[#FAFAFA] font-sans flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500"
    >
      {/* WebGL smokey background (only the shader; the existing form is preserved) */}
      <div className="absolute inset-0 z-0 bg-[#0A0A0A]">
        <SmokeyBackground color="#B8A070" backdropBlurAmount="none" />
      </div>

      <div className="relative z-10 absolute top-8 sm:top-12 left-6 sm:left-12 flex items-center gap-3">
        <button 
          onClick={() => { navigate('/'); }}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          <ArrowLeft className="w-3 h-3" /> {t('nav.return_facade')}
        </button>
      </div>

      <div className="relative z-10 absolute top-8 sm:top-12 right-6 sm:right-12">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          {i18n.language === 'en' ? <Globe className="w-3 h-3" /> : <img src="/flags/my.svg" alt="Malaysia" className="w-4 h-3 rounded-sm" />}
          {i18n.language === 'en' ? 'EN' : 'MY'}
        </button>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="relative z-10 w-full max-w-md bg-white/80 dark:bg-[#1A1A1A]/70 backdrop-blur-xl border border-white/30 dark:border-zinc-700/50 p-8 sm:p-12 transition-colors shadow-2xl"
      >
        <div className="text-center mb-8 md:mb-10">
          <CustomShieldIcon className="w-8 h-8 mx-auto mb-4 text-black dark:text-white" />
          <h2 className="font-serif text-2xl md:text-3xl font-light tracking-tight text-black dark:text-white">{isRegistering ? t('login.establish_profile') : t('login.member_login')}</h2>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mt-2 font-bold">{isRegistering ? t('login.join_network') : t('login.welcome_back')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500 mb-2">{t('login.identifier_label')}</label>
            <input 
              type="text" 
              value={username}
              onChange={e => { setUsername(e.target.value); }}
              className="w-full p-4 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm focus:border-black dark:focus:border-white focus:outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium"
              placeholder={t('login.identifier_placeholder')}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 dark:text-zinc-500 mb-2">{t('login.sequence_label')}</label>
            <input 
              type="password" 
              value={password}
              onChange={e => { setPassword(e.target.value); }}
              className="w-full p-4 border border-zinc-200 dark:border-zinc-800 bg-transparent text-black dark:text-white text-sm focus:border-black dark:focus:border-white focus:outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700 font-medium"
              placeholder={t('login.sequence_placeholder')}
              required
            />
          </div>
          {isRegistering && (
            <div className="flex items-start gap-3 mt-4 mb-6">
              <input
                type="checkbox"
                id="pdpa"
                checked={pdpaConsent}
                onChange={(e) => { setPdpaConsent(e.target.checked); }}
                className="mt-1 accent-black dark:accent-white w-4 h-4"
                required
              />
              <label htmlFor="pdpa" className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                {t('login.pdpa')}
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (isRegistering && !pdpaConsent)}
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? t('login.processing') : isRegistering ? t('login.establish_profile') : t('login.authenticate')}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-[#1A1A1A] px-3 text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
              or
            </span>
          </div>
        </div>

        <a
          href={`${API_URL}/oauth2/authorization/google`}
          className="flex items-center justify-center gap-3 w-full py-3.5 border border-zinc-300 dark:border-zinc-700 text-sm font-medium text-black dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </a>

        <div className="mt-8 text-center border-t border-zinc-100 dark:border-zinc-800 pt-8">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); }}
            className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
          >
            {isRegistering ? t('login.login_cta') : t('login.register_cta')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

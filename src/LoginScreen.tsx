import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { api } from './api/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
      className="min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] font-sans flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-500"
    >
      <div className="absolute top-8 sm:top-12 left-6 sm:left-12 flex items-center gap-3">
        <button 
          onClick={() => { navigate('/'); }}
          className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
        >
          <ArrowLeft className="w-3 h-3" /> {t('nav.return_facade')}
        </button>
      </div>

      <div className="absolute top-8 sm:top-12 right-6 sm:right-12">
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
        className="w-full max-w-md bg-white dark:bg-[#1A1A1A] border border-zinc-200 dark:border-zinc-800 p-8 sm:p-12 transition-colors"
      >
        <div className="text-center mb-8 md:mb-10">
          <ShieldCheck className="w-8 h-8 mx-auto mb-4 text-black dark:text-white" />
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

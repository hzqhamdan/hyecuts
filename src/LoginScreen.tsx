import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { ArrowLeft, ShieldCheck, Globe } from 'lucide-react';
import { API_URL } from './config';
import { useTranslation } from 'react-i18next';

export default function LoginScreen({ setView }: { setView: (view: string) => void }) {
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
    
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    void (async () => {
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        
        if (res.ok) {
          const data = (await res.json()) as { token: string; userId: string; role: string };
          login(data.token, data.userId, data.role, username);
          // Direct users based on role
          if (data.role === 'ROLE_ADMIN') {
            setView('atelier');
          } else {
            setView('lounge');
          }
        } else {
          const errText = await res.text();
          setError(errText || 'Authentication failed');
        }
      } catch {
        setError('Network error or server unreachable');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-white text-black font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden"
    >
      <button 
        onClick={() => { setView('facade'); }}
        className="absolute top-12 left-12 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> {t('nav.return_facade')}
      </button>

      <button 
        onClick={toggleLanguage}
        className="absolute top-12 right-12 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400 hover:text-black transition-colors"
      >
        <Globe className="w-3 h-3" /> {i18n.language === 'en' ? 'MS' : 'EN'}
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white border border-zinc-200 p-12"
      >
        <div className="text-center mb-10">
          <ShieldCheck className="w-8 h-8 mx-auto mb-4 text-black" />
          <h2 className="font-serif text-3xl font-light tracking-tight">{isRegistering ? t('login.establish_profile') : t('login.member_login')}</h2>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2">{isRegistering ? t('login.join_network') : t('login.welcome_back')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">{t('login.identifier_label')}</label>
            <input 
              type="text" 
              value={username}
              onChange={e => { setUsername(e.target.value); }}
              className="w-full p-4 border border-zinc-200 text-sm focus:border-black focus:outline-none transition-colors"
              placeholder={t('login.identifier_placeholder')}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">{t('login.sequence_label')}</label>
            <input 
              type="password" 
              value={password}
              onChange={e => { setPassword(e.target.value); }}
              className="w-full p-4 border border-zinc-200 text-sm focus:border-black focus:outline-none transition-colors"
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
                className="mt-1 accent-black"
                required
              />
              <label htmlFor="pdpa" className="text-xs text-zinc-500 leading-relaxed">
                {t('login.pdpa')}
              </label>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || (isRegistering && !pdpaConsent)}
            className="w-full py-4 bg-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? t('login.processing') : isRegistering ? t('login.establish_profile') : t('login.authenticate')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-100 pt-8">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); }}
            className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
          >
            {isRegistering ? t('login.login_cta') : t('login.register_cta')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

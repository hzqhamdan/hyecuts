import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function LoginScreen({ setView }: { setView: (view: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const res = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
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
    } catch (err) {
      setError('Network error or server unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen bg-white text-black font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden"
    >
      <button 
        onClick={() => setView('facade')}
        className="absolute top-12 left-12 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-luxury-slate hover:text-luxury-black transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Return to Facade
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white border border-zinc-200 p-12"
      >
        <div className="text-center mb-10">
          <ShieldCheck className="w-8 h-8 mx-auto mb-4 text-black" />
          <h2 className="font-serif text-3xl font-light tracking-tight">{isRegistering ? 'Client Registry' : 'Atelier Access'}</h2>
          <p className="text-[10px] uppercase tracking-widest text-zinc-400 mt-2">Secure Authentication</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-4 border border-zinc-200 text-sm focus:border-black focus:outline-none transition-colors"
              placeholder="Enter your identifier"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-4 border border-zinc-200 text-sm focus:border-black focus:outline-none transition-colors"
              placeholder="Enter your sequence"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : isRegistering ? 'Register Profile' : 'Authenticate'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-100 pt-8">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
          >
            {isRegistering ? 'Already have access? Login' : 'New client? Register here'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

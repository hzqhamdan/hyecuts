import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AdminLogin = ({ setView }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be a secure API call.
    // For this prototype, we use a simple master key.
    if (password === 'curator-2026') {
      setView('admin');
    } else {
      setError('Invalid access key. Access denied.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-12 text-center"
      >
        <div className="space-y-4">
          <h1 className="font-serif text-4xl font-light italic tracking-tighter">
            Atelier Access
          </h1>
          <p className="text-zinc-400 text-[11px] uppercase tracking-widest">
            Authorized Personnel Only
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Access Key"
              className="w-full text-center py-4 bg-transparent border-b border-black focus:outline-none font-mono text-sm tracking-widest placeholder:text-zinc-200 transition-all"
              autoFocus
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-[10px] uppercase tracking-widest"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-zinc-800 transition-all"
          >
            Authorize
          </button>
        </form>

        <div className="pt-12">
          <button
            onClick={() => setView('facade')}
            className="text-[10px] uppercase tracking-widest text-zinc-300 hover:text-black transition-colors"
          >
            Return to Facade
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ValidatorProps {
  code: string;
  setCode: (code: string) => void;
  state: 'idle' | 'granted' | 'denied';
  onValidate: (e: React.FormEvent) => void;
}

export function ValidatorFocusMode({ code, setCode, state, onValidate }: ValidatorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-3xl mx-auto">
      <div className="w-full text-center mb-16">
        <h2 className="font-serif text-5xl mb-4 font-light">The Validator</h2>
        <p className="text-zinc-400 italic text-sm uppercase tracking-widest">Sequence Authorization</p>
      </div>

      <motion.div
        className={`w-full p-16 border transition-all duration-700 ${
          state === 'granted' ? 'border-green-500 bg-green-50/10' :
          state === 'denied' ? 'border-red-500 bg-red-50/10' :
          'border-black bg-white'
        }`}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
      >
        <form onSubmit={onValidate} className="flex flex-col items-center gap-12">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HC-XXXX-XXXX"
            className="w-full text-center text-5xl font-serif uppercase tracking-[0.3em] bg-transparent border-b border-black focus:outline-none focus:border-black transition-all placeholder:text-zinc-200"
            autoFocus
          />
          <button
            type="submit"
            className="px-16 py-4 bg-black text-white uppercase tracking-[0.2em] text-[10px] font-bold hover:bg-zinc-800 transition-all"
          >
            Execute Validation
          </button>
        </form>

        <div className="mt-16 flex justify-center">
          <AnimatePresence mode="wait">
            {state === 'granted' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 text-green-600 font-bold uppercase tracking-widest text-[11px]"
              >
                <CheckCircle2 size={16} /> Access Granted
              </motion.div>
            )}
            {state === 'denied' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 text-red-600 font-bold uppercase tracking-widest text-[11px]"
              >
                <XCircle size={16} /> Access Denied
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

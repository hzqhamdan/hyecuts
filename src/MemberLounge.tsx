import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';

const MemberLounge = ({ setView }) => {
  const [progress, setProgress] = useState(78);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  const rewards = [
    { id: 'r1', title: 'Complimentary Hot Towel', tier: 'Silver', desc: 'A signature sensory experience featuring eucalyptus-infused steam.', serial: 'HYE-Lounge-001-S' },
    { id: 'r2', title: 'Precision Beard Sculpt', tier: 'Silver', desc: 'Advanced detailing session with artisan razor techniques.', serial: 'HYE-Lounge-002-S' },
    { id: 'r3', title: 'Elite Grooming Kit', tier: 'Gold', desc: 'A curated collection of studio essentials for home maintenance.', serial: 'HYE-Lounge-003-G' },
    { id: 'r4', title: 'The Studio Pass', tier: 'Platinum', desc: 'Priority booking, concierge service, and exclusive lounge access.', serial: 'HYE-Lounge-004-P' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-white text-black px-12 py-16 font-sans overflow-x-hidden"
    >
      {/* Navigation Header */}
      <nav className="flex justify-between items-center max-w-7xl mx-auto mb-24">
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => setView('facade')}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-luxury-slate hover:text-luxury-black transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Return to Facade
        </motion.button>
        <div className="font-display text-2xl tracking-tighter uppercase font-medium italic">
          The Member Lounge
        </div>
        <button
          onClick={() => setView('login')}
          className="text-[10px] uppercase tracking-widest text-zinc-300 hover:text-black transition-colors font-medium"
        >
          Atelier Access
        </button>
      </nav>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">

        {/* SECTION 1: STATUS CARD (The Centerpiece) */}
        <section className="lg:w-1/3 flex flex-col items-center">
          <div className="relative group">
            {/* Ambient Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-luxury-slate/20 to-transparent blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative w-80 h-[460px] bg-gradient-to-br from-neutral-900 via-neutral-800 to-black rounded-3xl p-8 text-white shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10"
              style={{ perspective: '1000px' }}
            >
              {/* Metallic Texture Overlay */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')]" />

              <div className="relative z-10 flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest opacity-50 font-sans">Membership Tier</span>
                  <h2 className="font-display text-3xl uppercase tracking-tight mt-1">Platinum</h2>
                </div>
                <ShieldCheck className="w-6 h-6 opacity-80" />
              </div>

              {/* The Status Halo / Progress Ring */}
              <div className="relative z-10 flex justify-center py-12">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  {/* Outer Multi-layered Ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96" cy="96" r="90"
                      stroke="currentColor" strokeWidth="1"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="96" cy="96" r="90"
                      stroke="currentColor" strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={565}
                      strokeDashoffset={565 - (565 * progress) / 100}
                      className="text-white transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-serif text-5xl font-light tracking-tighter">{progress}%</span>
                    <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 mt-1">to Diamond</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-6">
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest opacity-40 block mb-1">Visits</span>
                    <span className="font-display text-xl">42</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest opacity-40 block mb-1">Tenure</span>
                    <span className="font-display text-xl">2 Yrs</span>
                  </div>
                </div>
                <div className="text-center text-[10px] uppercase tracking-[0.3em] opacity-30">
                  Certified Hyecuts Elite
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-12 text-center max-w-xs">
            <p className="font-sans text-luxury-slate text-xs leading-relaxed italic">
              "The pinnacle of grooming. Your status grants you access to the most refined services in the city."
            </p>
          </div>
        </section>

        {/* SECTION 2: REWARD PORTFOLIO */}
        <section className="lg:w-2/3">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">The Portfolio</h3>
              <p className="font-sans text-luxury-slate text-sm tracking-wide">Curated rewards and invitations</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium uppercase tracking-widest border-b border-luxury-black pb-1">
                {rewards.length} Available Assets
              </span>
            </div>
          </div>

          {/* Editorial Layout Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {rewards.map((reward, idx) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.15 }}
                className="relative group cursor-pointer"
                onClick={() => setSelectedVoucher(reward)}
              >
                <div className="relative overflow-hidden aspect-[1.6/1] bg-white border border-black/10 p-8 flex flex-col justify-between transition-all duration-500 group-hover:shadow-xl group-hover:border-black">

                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-luxury-black rounded-full" />
                      <span className="text-[9px] uppercase tracking-widest font-medium">{reward.tier} Access</span>
                    </div>
                    <Sparkles className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Middle Content Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                    <div className="bg-luxury-black text-white px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2">
                      Reveal Invitation <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h4 className="font-display text-xl uppercase tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-luxury-slate font-sans leading-relaxed max-w-xs line-clamp-2">
                      {reward.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* SIGNATURE TRANSITION: Voucher Modal */}
      <AnimatePresence>
        {selectedVoucher && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/95 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-luxury-white w-full max-w-lg relative overflow-hidden shadow-2xl"
              style={{ perspective: '1000px' }}
            >
              {/* Luxury Invitation Styling */}
              <div className="p-12 flex flex-col items-center text-center">
                <div className="w-full border-t border-b border-luxury-black py-8 mb-12">
                  <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-luxury-slate block mb-4">Exclusive Invitation</span>
                  <h2 className="font-display text-4xl uppercase tracking-tighter mb-2">The Studio</h2>
                  <div className="h-px w-12 bg-luxury-black mx-auto mt-6" />
                </div>

                <div className="relative group mb-12">
                  {/* Physical Card Feel */}
                  <div className="bg-neutral-50 border border-luxury-black/20 p-10 flex flex-col items-center gap-8 w-72 shadow-sm">
                    <div className="bg-black p-6 rounded-none">
                      <Award className="w-20 h-20 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="font-display text-lg uppercase tracking-tight">{selectedVoucher.title}</div>
                      <div className="font-mono text-[10px] text-luxury-slate tracking-widest">
                        SN: {selectedVoucher.serial}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="bg-luxury-black text-white py-4 text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                  >
                    Redeem Asset
                  </motion.button>
                  <button
                    onClick={() => setSelectedVoucher(null)}
                    className="text-[10px] uppercase tracking-widest text-luxury-slate hover:text-luxury-black transition-colors"
                  >
                    Close Portfolio
                  </button>
                </div>
              </div>

              {/* Decorative Corner Elements */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-luxury-black/10" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-luxury-black/10" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-luxury-black/10" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-luxury-black/10" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MemberLounge;

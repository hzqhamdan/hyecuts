import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Menu, X, Instagram, Facebook } from 'lucide-react';

interface LandingPageProps {
  setView: (view: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-luxury-white text-luxury-black font-sans selection:bg-luxury-black selection:text-luxury-white overflow-x-hidden">
      {/* Ghost Header */}
      <nav className="fixed top-0 left-0 w-full z-50 px-luxury-lg py-luxury-sm flex justify-between items-center backdrop-blur-md bg-luxury-white/70 border-b border-luxury-black/5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-display text-2xl font-bold tracking-tighter"
        >
          THE STUDIO<span className="text-luxury-slate">.</span>
        </motion.div>

        <div className="hidden md:flex gap-12 text-xs uppercase tracking-[0.2em] font-medium">
          {['Philosophy', 'Services', 'Experience', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="hover:text-luxury-slate transition-colors duration-300 cursor-pointer"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setView('lounge')}
            className="hidden md:block px-6 py-2 text-xs uppercase tracking-widest border border-luxury-black hover:bg-luxury-black hover:text-luxury-white transition-all duration-500"
          >
            Enter Lounge
          </button>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 bg-luxury-white pt-24 px-luxury-lg flex flex-col gap-8 text-center"
        >
          {['Philosophy', 'Services', 'Experience', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-4xl font-display italic lowercase tracking-tight hover:pl-4 transition-all duration-300"
              onClick={() => setIsMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => { setIsMenuOpen(false); setView('lounge'); }}
            className="mt-8 px-8 py-4 bg-luxury-black text-luxury-white uppercase tracking-widest text-xs"
          >
            Enter Lounge
          </button>
        </motion.div>
      )}

      {/* Cinematic Hero */}
      <section className="relative h-screen flex items-center justify-center px-luxury-lg pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.05 }}
            transition={{ duration: 2 }}
            className="absolute -right-20 -top-20 w-[600px] h-[600px] rounded-full bg-luxury-slate blur-[120px]"
          />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-start"
          >
            <motion.span
              variants={fadeUp}
              className="text-xs uppercase tracking-[0.4em] text-luxury-slate mb-6 block"
            >
              Hyecuts Barbershop Presents
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="font-display text-[12vw] leading-[0.85] font-bold tracking-tighter mb-8"
            >
              The Studio<span className="text-luxury-slate">.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="max-w-xl text-lg md:text-xl text-luxury-slate leading-relaxed mb-12 font-light"
            >
              A sanctuary of absolute precision. Where high-fashion minimalism meets the timeless art of grooming.
              Architectural cuts for the modern icon.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={() => setView('lounge')}
                className="group relative px-10 py-5 bg-luxury-black text-luxury-white overflow-hidden transition-all duration-500 hover:pr-14"
              >
                <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-medium">Secure Appointment</span>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-10px] group-hover:translate-x-0" size={16} />
              </button>
              <button className="px-10 py-5 text-xs uppercase tracking-[0.2em] font-medium border border-luxury-black hover:bg-luxury-black hover:text-luxury-white transition-all duration-500">
                Our Philosophy
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Architectural Philosophy Section */}
      <section id="philosophy" className="py-luxury-xl px-luxury-lg bg-luxury-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Bold Statement */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="lg:col-span-5 relative"
            >
              <span className="text-xs uppercase tracking-widest text-luxury-slate mb-4 block">The Standard</span>
              <h2 className="font-display text-6xl md:text-8xl leading-tight font-bold tracking-tighter mb-8">
                Precision <br />
                <span className="italic font-normal text-luxury-slate">Above All</span>
              </h2>
              <div className="h-px w-24 bg-luxury-black mb-8" />
            </motion.div>

            {/* Right Column: Editorial Grid */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2 }}
              className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <div className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-luxury-slate/10 mb-6 overflow-hidden relative">
                    <div className="absolute inset-0 bg-luxury-black/0 group-hover:bg-luxury-black/10 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                       <span className="text-xs uppercase tracking-widest text-luxury-black font-bold">View Detail</span>
                    </div>
                  </div>
                  <h3 className="font-display text-2xl mb-2">The Silhouette</h3>
                  <p className="text-sm text-luxury-slate leading-relaxed uppercase tracking-wider">
                    Every line is a decision. Every fade is a study in geometry. We sculpt the form to match the identity.
                  </p>
                </div>
                <div className="pt-12">
                  <p className="text-xl font-display italic leading-relaxed text-luxury-black">
                    "Luxury is not about excess; it is about the absolute removal of the unnecessary until only perfection remains."
                  </p>
                </div>
              </div>

              <div className="space-y-8 md:mt-24">
                <div className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-luxury-slate/10 mb-6 overflow-hidden relative">
                     <div className="absolute inset-0 bg-luxury-black/0 group-hover:bg-luxury-black/10 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                       <span className="text-xs uppercase tracking-widest text-luxury-black font-bold">View Detail</span>
                    </div>
                  </div>
                  <h3 className="font-display text-2xl mb-2">The Ritual</h3>
                  <p className="text-sm text-luxury-slate leading-relaxed uppercase tracking-wider">
                    Experience is the catalyst. From the scent of sandalwood to the weight of the shears, every detail is curated.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Socials */}
      <footer className="py-luxury-lg px-luxury-lg border-t border-luxury-black/5 bg-luxury-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div>
            <div className="font-display text-4xl font-bold tracking-tighter mb-8">
              THE STUDIO<span className="text-luxury-slate">.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="p-2 border border-luxury-black/10 hover:border-luxury-black transition-all duration-300 text-luxury-slate hover:text-luxury-black">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-2 border border-luxury-black/10 hover:border-luxury-black transition-all duration-300 text-luxury-slate hover:text-luxury-black">
                <Facebook size={20} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-right">
            <span className="text-xs uppercase tracking-widest text-luxury-slate">© 2026 Hyecuts Studio</span>
            <span className="text-xs uppercase tracking-widest text-luxury-slate">All Rights Reserved</span>
            <div className="flex justify-end gap-8 mt-4 text-[10px] uppercase tracking-widest font-medium">
              <a href="#" className="hover:text-luxury-slate transition-colors">Privacy</a>
              <a href="#" className="hover:text-luxury-slate transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

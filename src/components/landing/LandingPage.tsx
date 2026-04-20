import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';

interface LandingPageProps {
  setView: (view: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white overflow-x-hidden"
    >
      {/* Ghost Header */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center backdrop-blur-md bg-white/70 border-b border-zinc-100">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-serif text-xl tracking-tighter uppercase font-light italic"
        >
          Hyecuts
        </motion.div>

        <div className="hidden md:flex gap-12 text-[10px] uppercase tracking-widest font-medium">
          {['Philosophy', 'Services', 'Experience', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-zinc-400 transition-colors duration-300 cursor-pointer"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setView('lounge')}
            className="hidden md:block px-6 py-2 text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all duration-500 font-bold"
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
          className="fixed inset-0 z-40 bg-white pt-24 px-12 flex flex-col gap-8 text-center"
        >
          {['Philosophy', 'Services', 'Experience', 'Contact'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-4xl font-serif italic lowercase tracking-tight hover:pl-4 transition-all duration-300"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => { setIsMenuOpen(false); setView('lounge'); }}
            className="mt-8 px-8 py-4 bg-black text-white uppercase tracking-widest text-xs font-bold"
          >
            Enter Lounge
          </button>
        </motion.div>
      )}

      {/* Cinematic Hero */}
      <section className="relative h-screen flex items-center justify-center px-6 md:px-12 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.span
              variants={fadeUp}
              className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-6 block"
            >
              Hyecuts Barbershop Presents
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="font-serif text-6xl md:text-9xl leading-tight font-light italic tracking-tighter mb-8"
            >
              The Studio<span className="text-zinc-300">.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="max-w-xl text-lg md:text-xl text-zinc-400 leading-relaxed mb-12 font-light italic"
            >
              A sanctuary of absolute precision. Where high-fashion minimalism meets the timeless art of grooming.
              Architectural cuts for the modern icon.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-6">
              <button
                onClick={() => setView('lounge')}
                className="group relative px-10 py-5 bg-black text-white overflow-hidden transition-all duration-500 hover:bg-zinc-800"
              >
                <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-bold">Secure Appointment</span>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-10px] group-hover:translate-x-0" size={16} />
              </button>
              <button
                onClick={() => document.getElementById('philosophy')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold border border-black hover:bg-black hover:text-white transition-all duration-500"
              >
                Our Philosophy
              </button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-black to-transparent"
        />
      </section>

      {/* Architectural Philosophy Section */}
      <section id="philosophy" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 relative"
            >
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">The Standard</span>
              <h2 className="font-serif text-6xl md:text-8xl leading-tight font-light tracking-tighter mb-8">
                Precision <br />
                <span className="italic font-normal text-zinc-300">Above All</span>
              </h2>
              <div className="h-px w-24 bg-black mb-8" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12"
            >
              <div className="space-y-8">
                <div className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-zinc-50 mb-6 overflow-hidden relative border border-zinc-100">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                       <span className="text-[10px] uppercase tracking-widest text-black font-bold">View Detail</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl mb-2 italic">The Silhouette</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed uppercase tracking-wider">
                    Every line is a decision. Every fade is a study in geometry. We sculpt the form to match the identity.
                  </p>
                </div>
                <div className="pt-12">
                  <p className="text-xl font-serif italic leading-relaxed text-black">
                    "Luxury is not about excess; it is about the absolute removal of the unnecessary until only perfection remains."
                  </p>
                </div>
              </div>

              <div className="space-y-8 md:mt-24">
                <div className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-zinc-50 mb-6 overflow-hidden relative border border-zinc-100">
                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                       <span className="text-[10px] uppercase tracking-widest text-black font-bold">View Detail</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl mb-2 italic">The Ritual</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed uppercase tracking-wider">
                    Experience is the catalyst. From the scent of sandalwood to the weight of the shears, every detail is curated.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 md:px-12 bg-zinc-50 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-16 md:mb-24"
          >
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">The Menu</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter">Curated Services</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16">
            {[
              { title: "The Signature Cut", price: "$65", desc: "A bespoke architectural silhouette tailored to your exact structure. Includes wash and style." },
              { title: "The Executive Shave", price: "$55", desc: "A traditional hot towel ritual. Straight razor precision combined with essential oil therapy." },
              { title: "The Master Groom", price: "$110", desc: "The ultimate combined experience. Signature cut, executive shave, and scalp treatment." },
              { title: "Beard Sculpting", price: "$35", desc: "Geometric refinement of facial hair to complement bone structure and enhance presentation." }
            ].map((service, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: idx * 0.1 }}
                className="group border-b border-zinc-200 pb-8 cursor-pointer"
              >
                <div className="flex justify-between items-end mb-4">
                  <h3 className="font-serif text-2xl italic group-hover:pl-4 transition-all duration-300">{service.title}</h3>
                  <span className="font-mono text-sm tracking-widest">{service.price}</span>
                </div>
                <p className="text-xs text-zinc-500 uppercase tracking-widest leading-relaxed max-w-sm">{service.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section id="experience" className="py-24 md:py-40 px-6 md:px-12 bg-black text-white text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <span className="text-[10px] uppercase tracking-[0.4em] text-zinc-900 mb-8 block">Exclusive Access</span>
            <h2 className="font-serif text-5xl md:text-8xl font-light italic tracking-tighter mb-12">
              Beyond Grooming.
            </h2>
            <p className="text-lg text-zinc-900 font-light mb-16 leading-relaxed">
              Step into the Atelier. Our members gain access to exclusive events, private collections, and the Hyecuts gamified economy. Elevate your status with every visit.
            </p>
            <button
              onClick={() => setView('login')}
              className="px-12 py-5 text-xs uppercase tracking-[0.2em] font-bold border border-white hover:bg-white hover:text-black transition-all duration-500"
            >
              Unlock The Lounge
            </button>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Location</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter mb-12">The Studio</h2>
            
            <div className="space-y-8 font-sans text-sm uppercase tracking-widest text-zinc-500">
              <div>
                <p className="text-black font-bold mb-1">Address</p>
                <p>124 Architectural Ave.<br />District 9, Metropolis 10012</p>
              </div>
              <div>
                <p className="text-black font-bold mb-1">Hours</p>
                <p>Tues - Sat: 10:00 — 20:00<br />Sun - Mon: Closed (Private Bookings)</p>
              </div>
              <div>
                <p className="text-black font-bold mb-1">Direct Line</p>
                <p>+1 (555) 890-1234<br />concierge@hyecuts.com</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex items-center justify-center bg-zinc-50 border border-zinc-100 p-12"
          >
             <div className="text-center">
                <p className="font-serif text-3xl italic mb-6">Appointments are strictly managed.</p>
                <button
                  onClick={() => setView('login')}
                  className="px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-zinc-800 transition-all duration-500"
                >
                  Book Now
                </button>
             </div>
          </motion.div>
        </div>
      </section>

      {/* Footer / Socials */}
      <footer className="py-24 px-6 md:px-12 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
          <div className="flex flex-col items-center md:items-start">
            <div className="font-serif text-4xl font-light tracking-tighter mb-8 italic">
              Hyecuts<span className="text-zinc-300">.</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="p-2 border border-zinc-100 hover:border-black transition-all duration-300 text-zinc-400 hover:text-black">
                <span className="text-[10px] uppercase font-bold tracking-widest">IG</span>
              </a>
              <a href="#" className="p-2 border border-zinc-100 hover:border-black transition-all duration-300 text-zinc-400 hover:text-black">
                <span className="text-[10px] uppercase font-bold tracking-widest">FB</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-center md:text-right">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">© 2026 Hyecuts Studio</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400">All Rights Reserved</span>
            <div className="flex justify-center md:justify-end gap-8 mt-4 text-[10px] uppercase tracking-widest font-medium">
              <a href="#" className="hover:text-zinc-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
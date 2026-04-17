import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const LandingPage = ({ setView }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-white text-black overflow-x-hidden"
    >
      {/* Ghost Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: isScrolled ? 0 : -100 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50 px-12 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-zinc-100"
      >
        <div className="font-serif text-xl tracking-tighter uppercase font-light italic">
          Hyecuts
        </div>
        <div className="flex gap-8 items-center">
          <a href="#about" className="text-[10px] uppercase tracking-widest hover:text-zinc-400 transition-colors">About</a>
          <button
            onClick={() => setView('lounge')}
            className="px-4 py-1 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all"
          >
            Member Entry
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center items-center px-12 text-center">
        <div className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.5, 1] }}
          >
            <h1 className="font-serif text-7xl md:text-9xl tracking-tighter mb-6 leading-tight font-light italic">
              The Studio.
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.5, 1] }}
            className="mb-12"
          >
            <p className="font-sans text-lg md:text-xl text-zinc-400 max-w-xl mx-auto leading-relaxed tracking-wide text-balance italic">
              A sanctuary of precision and style. Where high-fashion minimalism meets the art of the cut.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="flex justify-center"
          >
            <button
              onClick={() => setView('lounge')}
              className="group flex items-center gap-4 px-12 py-4 bg-black text-white transition-all hover:bg-zinc-800"
            >
              <span className="uppercase tracking-[0.2em] text-[10px] font-bold">Enter Member Lounge</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        </div>

        {/* Decorative Architectural Line */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-black to-transparent"
        />
      </section>

      {/* Abstract Texture Section (Visual anchor) */}
      <section className="py-24 px-12 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="aspect-[4/5] bg-zinc-50 relative overflow-hidden border border-zinc-100"
        >
          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-700" />
          <div className="absolute inset-0 flex items-center justify-center text-zinc-200 font-serif text-9xl select-none italic">
            01
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="font-serif text-5xl tracking-tight font-light">Precision <br />Above All.</h2>
          <p className="font-sans text-zinc-400 leading-relaxed max-w-md italic">
            We believe in the luxury of detail. Every angle, every line, every fade is a calculated decision in a pursuit of absolute perfection.
          </p>
          <div className="pt-4">
            <button className="px-8 py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all">
              Explore Philosophy
            </button>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};

export default LandingPage;

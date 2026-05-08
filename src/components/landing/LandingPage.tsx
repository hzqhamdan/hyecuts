import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { BOOKING_POLICIES, BUSINESS_HOURS, HYECUTS, SERVICE_MENU, TEAM_MEMBERS } from '../../data/hyecuts';

interface LandingPageProps {
  setView: (view: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setView }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.14 },
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
      <nav className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center backdrop-blur-md bg-white/80 border-b border-zinc-100">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-serif text-xl tracking-tighter uppercase font-light italic"
        >
          Hyecuts
        </motion.div>

        <div className="hidden md:flex gap-10 text-[10px] uppercase tracking-widest font-medium">
          {['services', 'hours', 'contact'].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="hover:text-zinc-400 transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setView('booking')}
            className="hidden md:block px-6 py-2 text-[10px] uppercase tracking-widest border border-black hover:bg-black hover:text-white transition-all duration-500 font-bold"
          >
            Book Appointment
          </button>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 bg-white pt-24 px-10 flex flex-col gap-8 text-center"
        >
          {['services', 'hours', 'contact'].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="text-4xl font-serif italic tracking-tight capitalize"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(false);
                document.getElementById(item)?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {item}
            </a>
          ))}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              setView('booking');
            }}
            className="mt-8 px-8 py-4 bg-black text-white uppercase tracking-widest text-xs font-bold"
          >
            Book Appointment
          </button>
        </motion.div>
      )}

      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 text-center pt-24">
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col items-center">
            <motion.span variants={fadeUp} className="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-6 block">
              {HYECUTS.name}
            </motion.span>
            <motion.h1 variants={fadeUp} className="font-serif text-6xl md:text-9xl leading-tight font-light italic tracking-tighter mb-6">
              The Studio<span className="text-zinc-300">.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="max-w-2xl text-lg md:text-xl text-zinc-500 leading-relaxed mb-10 font-light italic">
              Precision cuts, curated service, and a barbershop experience built around the real Hyecuts schedule and service menu.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setView('booking')}
                className="group relative px-10 py-5 bg-black text-white overflow-hidden transition-all duration-500 hover:bg-zinc-800"
              >
                <span className="relative z-10 text-xs uppercase tracking-[0.2em] font-bold">Secure Appointment</span>
                <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-[-10px] group-hover:translate-x-0" size={16} />
              </button>
              <button
                onClick={() => setView('lounge')}
                className="px-10 py-5 text-xs uppercase tracking-[0.2em] font-bold border border-black hover:bg-black hover:text-white transition-all duration-500"
              >
                Member Lounge
              </button>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-12 text-[10px] uppercase tracking-[0.3em] text-zinc-400">
              3361 Jalan Sungai Penchala, Kuala Lumpur
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="services" className="py-24 px-6 md:px-12 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Services & Pricing</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter">The Menu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {SERVICE_MENU.map((service) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="border border-zinc-200 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-2">{service.category}</p>
                    <h3 className="font-serif text-2xl italic leading-tight">{service.name}</h3>
                  </div>
                  <span className="font-mono text-sm whitespace-nowrap">{service.price}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-500">
                  <span>{service.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="hours" className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Business Hours</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter mb-8">Weekly Schedule</h2>
            <div className="space-y-4">
              {BUSINESS_HOURS.map((slot) => (
                <div key={slot.day} className="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <span className="text-sm uppercase tracking-widest">{slot.day}</span>
                  <span className={`text-sm ${slot.open ? 'text-black' : 'text-zinc-400'}`}>{slot.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-100 p-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Booking Policies</span>
            <h3 className="font-serif text-3xl italic mb-6">Arrive prepared</h3>
            <div className="space-y-4">
              {BOOKING_POLICIES.map((policy) => (
                <p key={policy} className="text-sm text-zinc-600 leading-relaxed">
                  {policy}
                </p>
              ))}
            </div>
            <button
              onClick={() => setView('booking')}
              className="mt-8 px-8 py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all"
            >
              Reserve a Slot
            </button>
          </div>
        </div>
      </section>

      <section id="contact" className="py-24 px-6 md:px-12 bg-zinc-50 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Contact</span>
            <h2 className="font-serif text-5xl md:text-7xl font-light tracking-tighter mb-8">Visit Hyecuts</h2>
            <div className="space-y-6 text-sm text-zinc-600">
              <div>
                <p className="text-black font-bold mb-1 uppercase tracking-widest text-[10px]">Address</p>
                <p>{HYECUTS.address}</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest text-zinc-400">Waze: {HYECUTS.waze}</p>
              </div>
              <div>
                <p className="text-black font-bold mb-1 uppercase tracking-widest text-[10px]">Contact</p>
                <p>{HYECUTS.phone}</p>
                <p>{HYECUTS.email}</p>
              </div>
              <div>
                <p className="text-black font-bold mb-1 uppercase tracking-widest text-[10px]">Team Members</p>
                {TEAM_MEMBERS.map((member) => (
                  <p key={member.name}>
                    {member.name} — {member.role}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-8">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Social</span>
            <div className="space-y-4">
              <a className="block text-sm hover:underline" href={HYECUTS.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a className="block text-sm hover:underline" href={HYECUTS.facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
            </div>
            <button
              onClick={() => setView('booking')}
              className="mt-8 px-8 py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-zinc-800 transition-all duration-500"
            >
              Book Now
            </button>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 md:px-12 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="font-serif text-4xl font-light tracking-tighter italic">
            Hyecuts<span className="text-zinc-300">.</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-400">
            {HYECUTS.address}
          </div>
        </div>
      </footer>
    </motion.div>
  );
};

export default LandingPage;

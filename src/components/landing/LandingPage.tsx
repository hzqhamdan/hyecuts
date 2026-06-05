import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useBookingStore } from '../../store/useBookingStore';
import { useNavigate } from 'react-router-dom';
import { fadeUp } from '../../utils/animations';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import HeroSection from './HeroSection';
import ServicesSection from './ServicesSection';
import HoursSection from './HoursSection';
import ContactSection from './ContactSection';
import Footer from './Footer';

const LandingPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openCategory, setOpenCategory, selectedService, setSelectedService } = useBookingStore();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    void i18n.changeLanguage(newLang);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] font-sans selection:bg-black selection:text-white overflow-x-hidden transition-colors duration-500"
    >
      <Navbar
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => { setIsMenuOpen(!isMenuOpen); }}
        token={token}
        onToggleLanguage={toggleLanguage}
        i18nLang={i18n.language}
      />
      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => { setIsMenuOpen(false); }}
        token={token}
        onToggleLanguage={toggleLanguage}
        i18nLang={i18n.language}
      />
      <HeroSection />
      <ServicesSection />
      <HoursSection />
      <ContactSection />
      <Footer />
    </motion.div>
  );
};

export default LandingPage;

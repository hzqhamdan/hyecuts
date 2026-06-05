import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/landing/Navbar';
import MobileMenu from '../components/landing/MobileMenu';
import HeroSection from '../components/landing/HeroSection';
import ServicesSection from '../components/landing/ServicesSection';
import HoursSection from '../components/landing/HoursSection';
import ContactSection from '../components/landing/ContactSection';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  const { i18n } = useTranslation();
  const { token } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

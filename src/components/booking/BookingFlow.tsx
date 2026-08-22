import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, ChevronDown, Calendar, Clock, CheckCircle, ShieldCheck, UserCircle, UserPlus, Globe } from 'lucide-react';
import { BOOKING_POLICIES, BUSINESS_HOURS, HYECUTS, ALL_SERVICES, SERVICE_CATEGORIES, TEAM_MEMBERS, AVAILABLE_TIMES, type ServiceItem } from '../../data/hyecuts';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { useBookingStore } from '../../store/useBookingStore';
import { useTranslation } from 'react-i18next';
import { PaymentStep } from './PaymentStep';
import { useNavigate } from 'react-router-dom';
import PWAInstallPrompt from '../ui/PWAInstallPrompt';

interface BookingResponse {
  id: number;
}

const STAFF = [
  { id: 'haiqal', name: 'Haiqal', role: 'Master Barber' },
  { id: 'naim', name: 'Naim', role: 'Senior Artisan' },
  { id: 'any', name: 'No Preference', role: 'First available' },
];

const DATES = BUSINESS_HOURS.map((slot, index) => ({
  id: `d${(index + 1).toString()}`,
  day: slot.day,
  hours: slot.hours,
}));

export default function BookingFlow() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { token, user } = useAuth();
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);

  const {
    step, setStep, nextStep, prevStep,
    openCategory, setOpenCategory,
    selectedService, setSelectedService,
    selectedStaff, setSelectedStaff,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    bookingRef, setBookingRef,
    isConfirming, setIsConfirming,
    reset
  } = useBookingStore();

  useEffect(() => {
    if (selectedDate) {
      setBookedTimes(['02:00 PM', '04:00 PM']);
    }
  }, [selectedDate]);

  useEffect(() => {
    // Automatically skip step 0 if the user is already logged in and we haven't advanced yet
    if (token && step === 0) {
      setStep(1);
    }
  }, [token, step, setStep]);

  useEffect(() => {
    // Clean up on unmount
    return () => { reset(); };
  }, [reset]);

  const handleConfirm = async () => {
    setIsConfirming(true);
    
    try {
      if (token && user) {
        let serviceId = 1;
        try {
          const services = await api.get<ServiceItem[]>('/services/active');
          const matchedService = services.find((s) => s.name === selectedService);
          if (matchedService) {
            serviceId = matchedService.id;
          }
        } catch (e) {
          console.error("Error fetching services", e);
        }

        const dayMap: Record<string, number> = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0 };
        const chosenDate = DATES.find((d) => d.id === selectedDate);
        const now = new Date();
        const localDate = new Date(now);
        if (chosenDate) {
          const targetDay = dayMap[chosenDate.day];
          // Next occurrence of the selected weekday (today only if picked and still upcoming).
          localDate.setDate(now.getDate() + ((targetDay + 7 - now.getDay()) % 7));
        } else {
          // No date was actually selected (shouldn't happen — Confirm is disabled
          // without one) — fall back to tomorrow rather than silently booking "today".
          localDate.setDate(now.getDate() + 1);
        }
        let hours = 12, mins = 0;
        if (selectedTime) {
          const match = /(\d+):(\d+)\s*(AM|PM)/i.exec(selectedTime);
          if (match) {
            hours = parseInt(match[1]);
            mins = parseInt(match[2]);
            if (match[3].toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (match[3].toUpperCase() === 'AM' && hours === 12) hours = 0;
          }
        }
        localDate.setHours(hours, mins, 0, 0);

        // Format as YYYY-MM-DDTHH:mm:ss manually to keep local time
        const pad = (n: number) => n.toString().padStart(2, '0');
        const localIso = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;

        const bookingReq = {
          userId: user.id,
          serviceId: serviceId,
          appointmentTime: localIso
        };

        try {
          const data = await api.post<BookingResponse>('/bookings', {
            body: bookingReq,
            token
          });
          setBookingRef(`HYC-${data.id.toString().slice(-4)}`);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'Booking failed';
          console.error("Booking failed:", message);
          alert(`Booking failed: ${message}`);
          setBookingRef(`HYC-${Date.now().toString().slice(-4)}`);
        }
      } else {
        // Guest flow
        setBookingRef(`HYC-${Date.now().toString().slice(-4)}`);
      }
    } catch (error) {
      console.error(error);
      setBookingRef(`HYC-${Date.now().toString().slice(-4)}`);
    }

    setIsConfirming(false);
    setStep(6);
  };

  const getService = () => ALL_SERVICES.find((service) => service.name === selectedService);
  const getStaff = () => STAFF.find((staff) => staff.id === selectedStaff);
  const getDate = () => DATES.find((date) => date.id === selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] font-sans flex flex-col p-4 sm:p-6 md:p-12 transition-colors duration-500"
    >
      <nav className="flex flex-col sm:grid sm:grid-cols-3 items-center max-w-5xl mx-auto w-full mb-8 sm:mb-10 gap-4 sm:gap-0">
        <div className="flex justify-between items-center w-full sm:w-auto sm:justify-self-start order-2 sm:order-1">
          <button
              onClick={() => {
                if (step === 0) navigate('/');
                else if (step === 1 && !token) setStep(0);
                else if (step === 1 || step === 6) navigate(token ? '/lounge' : '/');
                else prevStep();
              }}
              className="flex items-center gap-2 sm:gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>
                {step === 0 ? t('nav.return_home') : step === 1 || step === 6 ? (token ? t('nav.return_lounge') : t('nav.return_home')) : t('nav.prev_step')}
              </span>
            </button>
            
            {step > 0 && step < 6 && (
              <div className="sm:hidden text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-bold">
                {Math.min(step, 5)} / 5
              </div>
            )}
        </div>
        
        <div className="sm:justify-self-center font-serif text-xl sm:text-2xl tracking-tighter uppercase font-medium italic text-center text-black dark:text-white order-1 sm:order-2">
          {t('booking.title')}
        </div>
        
          <div className="hidden sm:flex sm:justify-self-end items-center gap-4 order-3">
            {step > 0 && step < 6 && (
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 font-bold">
                {t('booking.step_label', { current: Math.min(step, 5), total: 5 }).replace('{{current}}', Math.min(step, 5).toString()).replace('{{total}}', '5')}
              </div>
            )}
          <button
            onClick={() => {
              const newLang = i18n.language === 'en' ? 'ms' : 'en';
              void i18n.changeLanguage(newLang);
            }}
            className={`flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors ${step > 0 && step < 5 ? 'sm:border-l sm:border-zinc-200 dark:sm:border-zinc-800 sm:pl-4' : ''} font-bold`}
          >
            {i18n.language === 'en' ? <Globe size={12} /> : <img src="/flags/my.svg" alt="Malaysia" className="w-4 h-3 rounded-sm" />}
            {i18n.language === 'en' ? 'EN' : 'MY'}
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 md:gap-10">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center justify-center py-6 md:py-12">
                <h2 className="font-serif text-3xl sm:text-4xl uppercase tracking-tighter mb-4 text-center text-black dark:text-white">{t('booking.how_to_proceed')}</h2>
                <p className="text-zinc-500 dark:text-zinc-400 mb-10 md:mb-12 text-center max-w-md leading-relaxed font-light italic text-sm md:text-base px-4">
                  {t('login.join_network')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 w-full max-w-2xl px-4 sm:px-0">
                  <button
                    onClick={() => { navigate('/login'); }}
                    className="p-6 md:p-8 border border-black dark:border-white bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-900 dark:hover:bg-zinc-800 hover:text-white dark:hover:text-white transition-all flex flex-col items-center text-center group active:scale-[0.98]"
                  >
                    <UserCircle className="w-8 h-8 mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-2">{t('booking.login_cta')}</span>
                    <span className="text-xs opacity-60 font-light">{t('booking.login_desc')}</span>
                  </button>

                  <button
                    onClick={() => { setStep(1); }}
                    className="p-6 md:p-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] hover:border-black dark:hover:border-white transition-all flex flex-col items-center text-center group active:scale-[0.98]"
                  >
                    <UserPlus className="w-8 h-8 mb-4 text-zinc-400 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    <span className="text-[10px] uppercase tracking-widest font-bold mb-2 text-black dark:text-white">{t('booking.guest_cta')}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-light">{t('booking.guest_desc')}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-1 sm:px-0">
                <h2 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter mb-2 text-black dark:text-white">{t('booking.select_service')}</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-light italic">{t('booking.service_note')}</p>

                  <div className="space-y-4">
                    {SERVICE_CATEGORIES.map((categoryGroup) => {
                      const isOpen = openCategory === categoryGroup.category;
                      return (
                        <div key={categoryGroup.category} className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] transition-colors">
                          <button
                            onClick={() => { setOpenCategory(isOpen ? null : categoryGroup.category); }}
                            className="w-full px-5 py-4 md:px-6 md:py-5 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                          >
                            <span className="font-serif text-xl md:text-2xl italic text-black dark:text-white">{t(`data.categories.${categoryGroup.category}`)}</span>
                            <ChevronDown
                              className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-black dark:text-white`}
                              size={20}
                            />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-1 md:px-6 md:pb-6 space-y-3 border-t border-zinc-100 dark:border-zinc-800">
                                  {categoryGroup.services.map((service) => (
                                    <div
                                      key={service.name}
                                      onClick={() => { setSelectedService(service.name); }}
                                      className={`p-4 border-2 cursor-pointer transition-all duration-300 ${
                                        selectedService === service.name 
                                          ? '!border-[#B8A070] bg-white dark:bg-[#1A1A1A]' 
                                          : 'border-transparent dark:border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start mb-1 gap-4">
                                        <div>
                                          <h4 className={`font-serif text-base sm:text-lg uppercase tracking-tight transition-colors ${selectedService === service.name ? '!text-[#B8A070]' : 'text-black dark:text-white'}`}>
                                            {t(`data.services.${service.name}`)}
                                          </h4>
                                        </div>
                                        <span className={`font-mono text-[10px] sm:text-xs whitespace-nowrap font-bold transition-colors ${selectedService === service.name ? '!text-[#B8A070]' : 'text-black dark:text-white'}`}>
                                          {service.price}
                                        </span>
                                      </div>
                                      <div className="flex gap-4 text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
                                        <span>{service.duration}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                <button
                  onClick={nextStep}
                  disabled={!selectedService}
                  className="w-full mt-10 py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-30 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {t('booking.continue_barber')} <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-1 sm:px-0">
                <h2 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter mb-2 text-black dark:text-white">{t('booking.select_barber')}</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-light italic">{t('booking.barber_note')}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {STAFF.map((staff) => (
                    <div
                      key={staff.id}
                      onClick={() => { setSelectedStaff(staff.id); }}
                      className={`p-6 border-2 cursor-pointer text-center transition-all duration-300 ${
                        selectedStaff === staff.id 
                          ? 'border-studio-black dark:border-studio-gold bg-neutral-50 dark:bg-studio-gold/10' 
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center font-bold transition-colors ${selectedStaff === staff.id ? 'bg-studio-black dark:bg-studio-gold text-studio-white dark:text-studio-black' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500'}`}>
                        {staff.id === 'any' ? '?' : staff.name.charAt(0)}
                      </div>
                      <h3 className={`font-serif text-base sm:text-lg uppercase tracking-tight mb-1 transition-colors ${selectedStaff === staff.id ? 'text-studio-black dark:text-studio-gold' : 'text-studio-black dark:text-studio-white'}`}>
                        {staff.id === 'any' ? t('landing.no_preference') : staff.name}
                      </h3>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500 font-bold">{staff.id === 'any' ? t('landing.first_available') : t(`data.roles.${staff.role}`)}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  disabled={!selectedStaff}
                  className="w-full mt-10 py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-30 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {t('booking.continue_schedule')} <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-1 sm:px-0">
                <h2 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter mb-2 text-black dark:text-white">{t('booking.select_schedule')}</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-light italic">{t('booking.closed_note')}</p>

                <div className="mb-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                    <Calendar className="w-3 h-3" /> {t('booking.day')}
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x">
                    {DATES.map((date) => (
                      <div
                        key={date.id}
                        onClick={() => { setSelectedDate(date.id); }}
                        className={`min-w-[120px] snap-start flex-shrink-0 p-4 border-2 text-center cursor-pointer transition-all ${
                          selectedDate === date.id 
                            ? 'border-studio-black dark:border-studio-gold bg-studio-black dark:bg-studio-gold text-studio-white dark:text-studio-black font-bold' 
                            : 'border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:border-black dark:hover:border-white'
                        }`}
                      >
                        <div className={`text-[10px] uppercase tracking-widest mb-1 font-bold ${selectedDate === date.id ? 'opacity-100' : 'opacity-60'}`}>{t(`data.days.${date.day}`)}</div>
                        <div className={`font-serif text-lg ${selectedDate === date.id ? 'text-studio-white dark:text-studio-black' : 'text-zinc-500 dark:text-zinc-500'}`}>{date.hours}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`transition-opacity duration-300 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                    <Clock className="w-3 h-3" /> {t('booking.time')}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AVAILABLE_TIMES.map((time) => {
                      const isBooked = bookedTimes.includes(time);
                      return (
                        <div
                          key={time}
                          onClick={() => { if (!isBooked) setSelectedTime(time); }}
                          className={`p-3 border-2 text-center cursor-pointer text-xs font-mono transition-all ${
                            isBooked 
                              ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                              : selectedTime === time 
                                ? 'border-studio-black dark:border-studio-gold bg-studio-black dark:bg-studio-gold text-studio-white dark:text-studio-black font-bold' 
                                : 'border-zinc-200 dark:border-zinc-800 text-black dark:text-white hover:border-black dark:hover:border-white'
                          }`}
                        >
                          {time} {isBooked && '(Booked)'}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full mt-10 py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-30 flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  {t('booking.review_booking')} <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="px-1 sm:px-0">
                <h2 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter mb-2 text-black dark:text-white">{t('booking.final_review')}</h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-8 font-light italic">{t('booking.policy_note')}</p>

                <div className="bg-neutral-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 mb-10 transition-colors">
                  <div className="flex justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6 gap-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">{t('nav.services')}</div>
                      <div className="font-serif text-lg sm:text-xl uppercase tracking-tight text-black dark:text-white">{getService() ? t(`data.services.${getService()!.name}`) : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">{t('booking.total')}</div>
                      <div className="font-mono text-black dark:text-white font-bold">{getService()?.price}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">{t('booking.select_barber').split(' ')[1] || 'Barber'}</div>
                      <div className="text-xs sm:text-sm text-black dark:text-white font-medium">{getStaff()?.id === 'any' ? t('landing.no_preference') : getStaff()?.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">{t('booking.duration')}</div>
                      <div className="text-xs sm:text-sm text-black dark:text-white font-medium">{getService()?.duration}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">{t('booking.day')}</div>
                      <div className="text-xs sm:text-sm text-black dark:text-white font-medium">{getDate() ? t(`data.days.${getDate()!.day}`) : ''}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 font-bold">{t('booking.time')}</div>
                      <div className="text-xs sm:text-sm text-black dark:text-white font-medium">{selectedTime ? t(`data.times.${selectedTime}`, { defaultValue: selectedTime }) : ''}</div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2 text-black dark:text-white font-bold uppercase tracking-widest text-[9px] mb-2">
                      <ShieldCheck className="w-4 h-4 text-black dark:text-[#B8A070]" />
                      {t('landing.policy_2')}
                    </div>
                    {BOOKING_POLICIES.slice(0, 3).map((policy, idx) => (
                      <p key={policy} className="text-xs text-zinc-500 dark:text-zinc-500 italic leading-relaxed">
                        {t(`landing.policy_${idx + 1}`)}
                      </p>
                    ))}
                  </div>
                </div>

                  <button
                    onClick={() => { setStep(5); }}
                    disabled={isConfirming}
                    className="w-full py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 active:scale-[0.98] mb-3"
                  >
                    {t('booking.proceed_to_payment', { defaultValue: 'Proceed to Payment' })}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="w-full py-5 border border-black/20 dark:border-white/20 text-zinc-500 hover:text-black dark:hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors disabled:opacity-50 active:scale-[0.98]"
                  >
                    {t('booking.pay_at_shop', { defaultValue: 'Pay at Shop' })}
                  </button>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                  <PaymentStep onPaymentSuccess={() => { void handleConfirm(); }} />
                </motion.div>
              )}

              {step === 6 && (
                <motion.div key="step6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-20 h-20 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="font-serif text-4xl uppercase tracking-tighter mb-4 text-black dark:text-white">{t('booking.secured')}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">{t('booking.appointment_confirmed')}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-12 font-light italic">{t('booking.arrive_early')}</p>

                <div className="font-mono text-xs bg-neutral-50 dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 mb-12 inline-block text-black dark:text-white font-bold">
                  {t('booking.ref_label')}: {bookingRef || 'HYC-0000'}
                </div>

                <PWAInstallPrompt />

                <div className="flex flex-col gap-4">
                  {token && (
                    <button
                      onClick={() => { navigate('/my-bookings'); }}
                      className="w-full py-5 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                      {t('booking.view_appointments')}
                    </button>
                  )}
                  <button
                    onClick={() => { navigate(token ? '/lounge' : '/'); }}
                    className="w-full py-5 border border-black dark:border-white text-black dark:text-white text-[10px] uppercase tracking-widest font-bold hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    {token ? t('nav.return_lounge') : t('nav.return_home')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="w-full lg:sticky lg:top-6 h-fit bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-6 self-start transition-colors">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 block font-bold">{t('booking.notes')}</span>
          <h3 className="font-serif text-2xl italic mb-6 text-black dark:text-white">{HYECUTS.name}</h3>
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 font-light">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1 font-bold">{t('landing.address')}</p>
              <p>{HYECUTS.address}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1 font-bold">{t('landing.contact_details')}</p>
              <p>{HYECUTS.phone}</p>
              <p>{HYECUTS.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1 font-bold">{t('landing.team_members')}</p>
              {TEAM_MEMBERS.map((member) => (
                <p key={member.name}>
                  {member.name} — {t(`data.roles.${member.role}`)}
                </p>
              ))}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-1 font-bold">{t('landing.booking_policies')}</p>
              {BOOKING_POLICIES.map((policy, idx) => (
                <p key={policy} className="mb-2">
                  {t(`landing.policy_${idx + 1}`)}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

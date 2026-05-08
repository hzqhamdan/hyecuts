import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Calendar, Clock, CheckCircle, ShieldCheck } from 'lucide-react';
import { BOOKING_POLICIES, BUSINESS_HOURS, HYECUTS, SERVICE_MENU, TEAM_MEMBERS } from '../../data/hyecuts';

const STAFF = [
  { id: 'haiqal', name: 'Haiqal', role: 'Master Barber' },
  { id: 'naim', name: 'Naim', role: 'Senior Artisan' },
  { id: 'any', name: 'No Preference', role: 'First available' },
];

const DATES = BUSINESS_HOURS.filter((slot) => slot.open).map((slot, index) => ({
  id: `d${index + 1}`,
  day: slot.day,
  hours: slot.hours,
}));

const TIMES = ['12:00 PM', '2:30 PM', '4:00 PM', '6:00 PM', '8:00 PM'];

export default function BookingFlow({ setView }: { setView: (view: string) => void }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      setBookingRef(`HYC-${Date.now().toString().slice(-4)}`);
      setStep(5);
    }, 1200);
  };

  const getService = () => SERVICE_MENU.find((service) => service.name === selectedService);
  const getStaff = () => STAFF.find((staff) => staff.id === selectedStaff);
  const getDate = () => DATES.find((date) => date.id === selectedDate);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white text-black font-sans flex flex-col p-6 md:p-12"
    >
      <nav className="flex justify-between items-center max-w-5xl mx-auto w-full mb-10">
        <button
          onClick={() => (step === 1 || step === 5 ? setView('lounge') : prevStep())}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          {step === 1 || step === 5 ? 'Return to Lounge' : 'Previous Step'}
        </button>
        <div className="font-display text-xl tracking-tighter uppercase font-medium italic">Atelier Booking</div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-400">Step {Math.min(step, 4)} of 4</div>
      </nav>

      <div className="max-w-5xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="font-display text-3xl uppercase tracking-tighter mb-2">Select Service</h2>
                <p className="text-sm text-zinc-500 mb-8">Choose from the Hyecuts service menu.</p>

                <div className="space-y-4">
                  {SERVICE_MENU.map((service) => (
                    <div
                      key={service.name}
                      onClick={() => setSelectedService(service.name)}
                      className={`p-6 border cursor-pointer transition-all duration-300 ${
                        selectedService === service.name ? 'border-black bg-neutral-50' : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2 gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">{service.category}</div>
                          <h3 className="font-display text-xl uppercase tracking-tight">{service.name}</h3>
                        </div>
                        <span className="font-mono text-xs whitespace-nowrap">{service.price}</span>
                      </div>
                      <div className="flex gap-4 text-[10px] uppercase tracking-widest text-zinc-400">
                        <span>{service.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  disabled={!selectedService}
                  className="w-full mt-10 py-5 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-30 flex justify-center items-center gap-2"
                >
                  Continue to Barber <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="font-display text-3xl uppercase tracking-tighter mb-2">Select Barber</h2>
                <p className="text-sm text-zinc-500 mb-8">Haiqal and Naim are the listed team members in the studio notes.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {STAFF.map((staff) => (
                    <div
                      key={staff.id}
                      onClick={() => setSelectedStaff(staff.id)}
                      className={`p-6 border cursor-pointer text-center transition-all duration-300 ${
                        selectedStaff === staff.id ? 'border-black bg-neutral-50' : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="w-12 h-12 bg-zinc-100 rounded-full mx-auto mb-4 flex items-center justify-center text-zinc-500">
                        {staff.id === 'any' ? '?' : staff.name.charAt(0)}
                      </div>
                      <h3 className="font-display text-lg uppercase tracking-tight mb-1">{staff.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{staff.role}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={nextStep}
                  disabled={!selectedStaff}
                  className="w-full mt-10 py-5 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-30 flex justify-center items-center gap-2"
                >
                  Continue to Schedule <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="font-display text-3xl uppercase tracking-tighter mb-2">Select Schedule</h2>
                <p className="text-sm text-zinc-500 mb-8">Thursday is closed. Choose a day that works with your schedule.</p>

                <div className="mb-8">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Day
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {DATES.map((date) => (
                      <div
                        key={date.id}
                        onClick={() => setSelectedDate(date.id)}
                        className={`min-w-[120px] flex-shrink-0 p-4 border text-center cursor-pointer transition-all ${
                          selectedDate === date.id ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'
                        }`}
                      >
                        <div className="text-xs mb-1">{date.day}</div>
                        <div className={`font-display text-lg ${selectedDate === date.id ? 'text-white' : 'text-zinc-500'}`}>{date.hours}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`transition-opacity duration-300 ${selectedDate ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Time
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TIMES.map((time) => (
                      <div
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 border text-center cursor-pointer text-xs font-mono transition-all ${
                          selectedTime === time ? 'border-black bg-black text-white' : 'border-zinc-200 hover:border-black'
                        }`}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full mt-10 py-5 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-30 flex justify-center items-center gap-2"
                >
                  Review Booking <ChevronRight className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <h2 className="font-display text-3xl uppercase tracking-tighter mb-2">Final Review</h2>
                <p className="text-sm text-zinc-500 mb-8">Please confirm your appointment details and the studio policy reminders.</p>

                <div className="bg-neutral-50 border border-zinc-200 p-8 space-y-6 mb-10">
                  <div className="flex justify-between border-b border-zinc-200 pb-6 gap-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Service</div>
                      <div className="font-display text-xl uppercase tracking-tight">{getService()?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Total</div>
                      <div className="font-mono">{getService()?.price}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Barber</div>
                      <div className="text-sm">{getStaff()?.name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Duration</div>
                      <div className="text-sm">{getService()?.duration}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Day</div>
                      <div className="text-sm">{getDate()?.day}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Time</div>
                      <div className="text-sm">{selectedTime}</div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-200 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                      <ShieldCheck className="w-4 h-4 text-zinc-400" />
                      Arrive 10 minutes early and keep the slot to one person only.
                    </div>
                    {BOOKING_POLICIES.map((policy) => (
                      <p key={policy} className="text-sm text-zinc-500">
                        {policy}
                      </p>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full py-5 bg-black text-white text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isConfirming ? 'Securing Appointment...' : 'Confirm Appointment'}
                </button>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="font-display text-4xl uppercase tracking-tighter mb-4">Secured</h2>
                <p className="text-sm text-zinc-500 mb-2">Your appointment has been confirmed.</p>
                <p className="text-sm text-zinc-500 mb-12">Please arrive early and bring your booking reference.</p>

                <div className="font-mono text-xs bg-neutral-50 p-4 border border-zinc-200 mb-12 inline-block">
                  REF: {bookingRef || 'HYC-0000'}
                </div>

                <button
                  onClick={() => setView('lounge')}
                  className="w-full py-5 border border-black text-black text-[10px] uppercase tracking-widest hover:bg-neutral-50 transition-colors"
                >
                  Return to Lounge
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="w-full lg:sticky lg:top-6 h-fit bg-zinc-50 border border-zinc-100 p-6 self-start">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 mb-4 block">Hyecuts Notes</span>
          <h3 className="font-serif text-2xl italic mb-6">{HYECUTS.name}</h3>
          <div className="space-y-4 text-sm text-zinc-600">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Address</p>
              <p>{HYECUTS.address}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Contact</p>
              <p>{HYECUTS.phone}</p>
              <p>{HYECUTS.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Team</p>
              {TEAM_MEMBERS.map((member) => (
                <p key={member.name}>
                  {member.name} — {member.role}
                </p>
              ))}
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Booking Policy</p>
              {BOOKING_POLICIES.map((policy) => (
                <p key={policy} className="mb-2">
                  {policy}
                </p>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </motion.div>
  );
}

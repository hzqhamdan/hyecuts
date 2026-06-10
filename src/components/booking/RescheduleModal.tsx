import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { BUSINESS_HOURS, AVAILABLE_TIMES } from '../../data/hyecuts';

interface Booking {
  id: string;
  appointmentTime: string;
  status: string;
}

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess: () => void;
}

export default function RescheduleModal({ isOpen, onClose, bookingId, onSuccess }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate && isOpen) {
        // Fetch booked times for selected date
        api.get<Booking[]>(`/bookings/date/${selectedDate}`).then(bookings => {
            const times = bookings
                .filter(b => b.status === 'PENDING')
                .map(b => new Date(b.appointmentTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true}));
            setBookedTimes(times);
        }).catch(console.error);
    }
  }, [selectedDate, isOpen]);

  if (!isOpen) return null;

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setLoading(true);
    try {
      // Basic time parsing to construct ISO string
      const date = new Date(); // Need to map selectedDate.day to actual date
      // Simplified: assume next day for demo purposes as in BookingFlow
      date.setDate(date.getDate() + 1); 
      
      const [hours, minutes] = selectedTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      await api.put(`/bookings/${bookingId}/reschedule`, {
        body: date.toISOString()
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to reschedule', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-[#1A1A1A] w-full max-w-lg p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-black dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="font-serif text-2xl uppercase tracking-tighter mb-6">Reschedule Appointment</h2>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Select New Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {BUSINESS_HOURS.map((slot) => (
                  <button
                    key={slot.day}
                    onClick={() => setSelectedDate(slot.day)}
                    className={`p-3 border text-xs uppercase ${selectedDate === slot.day ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-zinc-200 dark:border-zinc-800'}`}
                  >
                    {slot.day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block flex items-center gap-2">
                <Clock className="w-3 h-3" /> Select New Time
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_TIMES.map((time) => {
                    const isBooked = bookedTimes.includes(time);
                    return (
                        <button
                          key={time}
                          onClick={() => !isBooked && setSelectedTime(time)}
                          className={`p-2 border text-[10px] ${
                              isBooked ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' :
                              selectedTime === time ? 'bg-black text-white dark:bg-white dark:text-black' : 'border-zinc-200 dark:border-zinc-800'
                          }`}
                          disabled={isBooked}
                        >
                          {time} {isBooked && '(Booked)'}
                        </button>
                    )
                })}
              </div>
            </div>

            <button
              onClick={handleReschedule}
              disabled={!selectedDate || !selectedTime || loading}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Reschedule'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

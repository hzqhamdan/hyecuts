import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { nextDateForWeekday, toLocalIsoString } from '../../utils/datetime';
import { BUSINESS_HOURS, timesForDay } from '../../data/hyecuts';

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
  token?: string | null;
}

export default function RescheduleModal({ isOpen, onClose, bookingId, onSuccess, token }: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate || !isOpen) return;
    const date = nextDateForWeekday(selectedDate);
    if (!date) return;

    // The previous day's slots don't apply to this one.
    setBookedTimes([]);
    let stale = false;
    // The endpoint takes a YYYY-MM-DD date. This used to send the weekday
    // name ("/bookings/date/Friday"), which the backend rejects, so booked
    // slots never showed and every time looked free (BK-051).
    api.get<Booking[]>(`/bookings/date/${toLocalIsoString(date).slice(0, 10)}`, { token: token ?? undefined }).then(bookings => {
        if (stale) return;
        // PENDING and CONFIRMED both hold the slot; CANCELLED/COMPLETED/NO_SHOW
        // don't (BK-050 — CONFIRMED bookings used to show as free here).
        const times = bookings
            .filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED')
            .map(b => new Date(b.appointmentTime).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit', hour12: true}));
        setBookedTimes(times);
        setSelectedTime(current => (current && times.includes(current) ? null : current));
    }).catch(console.error);
    return () => { stale = true; };
  }, [selectedDate, isOpen, token]);

  if (!isOpen) return null;

  function parseTime12h(timeStr: string): { hours: number; minutes: number } {
    const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr);
    if (!match) return { hours: 0, minutes: 0 };
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const mer = match[3].toUpperCase();
    if (mer === 'PM' && h !== 12) h += 12;
    if (mer === 'AM' && h === 12) h = 0;
    return { hours: h, minutes: m };
  }

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setLoading(true);
    try {
      // Same date the booked-slot lookup above used.
      const date = nextDateForWeekday(selectedDate);
      if (!date) throw new Error('Invalid day');

      const { hours, minutes } = parseTime12h(selectedTime);
      date.setHours(hours, minutes, 0, 0);

      await api.put(`/bookings/${bookingId}/reschedule`, {
        // Local wall-clock, not toISOString() (BK-016) — the backend parses
        // this into a timezone-naive LocalDateTime, so sending UTC shifted
        // every reschedule by the client's offset.
        body: { newAppointmentTime: toLocalIsoString(date) },
        token: token ?? undefined
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
                    onClick={() => {
                      setSelectedDate(slot.day);
                      // A time picked for another day may be outside this day's hours.
                      if (selectedTime && !timesForDay(slot.day).includes(selectedTime)) setSelectedTime(null);
                    }}
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
                {(selectedDate ? timesForDay(selectedDate) : []).map((time) => {
                    const isBooked = bookedTimes.includes(time);
                    return (
                        <button
                          key={time}
                          onClick={() => { if (!isBooked) setSelectedTime(time); }}
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
              onClick={() => { void handleReschedule(); }}
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

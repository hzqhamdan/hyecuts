import { useState, useEffect } from 'react';
import { User, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import type { Booking } from '../../types/loyalty';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8081') + '/api';

export function BookingsManager({ token }: { token: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBookings(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const completeBooking = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/bookings/${id}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-5xl mb-4 font-light">Active Bookings</h2>
        <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Appointment Management</p>
      </header>

      <div className="grid grid-cols-1 gap-px bg-zinc-200 border border-zinc-200">
        {loading ? (
          <div className="p-20 bg-white text-center text-zinc-400 uppercase tracking-widest text-xs">Accessing Schedule...</div>
        ) : bookings.filter(b => b.status === 'PENDING').length === 0 ? (
          <div className="p-20 bg-white text-center text-zinc-400 uppercase tracking-widest text-xs">No Pending Appointments</div>
        ) : (
          bookings.filter(b => b.status === 'PENDING').map(booking => (
            <div key={booking.id} className="p-10 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group hover:bg-zinc-50 transition-all">
              <div className="flex items-center gap-8">
                <div className="p-4 bg-zinc-100 rounded-full text-zinc-400">
                  <User size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-2xl italic">{booking.user.fullName || booking.user.email}</h4>
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(booking.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.appointmentTime).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-black font-bold uppercase tracking-[0.2em] mt-2">{booking.service.name}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400 block mb-1">Total Fee</span>
                  <span className="font-serif text-2xl">RM {booking.totalPriceMyr}</span>
                </div>
                <button
                  onClick={() => completeBooking(booking.id)}
                  className="w-full md:w-auto px-10 py-4 bg-black text-white text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} /> Complete & Award Points
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-24">
        <h3 className="font-serif text-2xl italic mb-8">Completed Today</h3>
        <div className="space-y-4">
           {bookings.filter(b => b.status === 'COMPLETED').slice(0, 5).map(b => (
             <div key={b.id} className="p-6 border border-zinc-100 flex justify-between items-center opacity-60">
                <div className="flex items-center gap-4">
                  <CheckCircle2 size={16} className="text-green-600" />
                  <span className="text-xs font-bold uppercase tracking-widest">{b.user.email}</span>
                  <span className="text-xs text-zinc-400">— {b.service.name}</span>
                </div>
                <span className="font-mono text-[10px] text-zinc-400">{new Date(b.appointmentTime).toLocaleTimeString()}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

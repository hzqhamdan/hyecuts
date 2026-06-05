import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Clock, Plus, X, Save, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TEAM_MEMBERS, BUSINESS_HOURS } from '../../data/hyecuts';

interface StaffProfile {
  id: string;
  name: string;
  role: string;
  schedule: Record<string, string>;
  isActive: boolean;
}

export function StaffManager() {
  const { t } = useTranslation();
  
  // Initial state derived from seeder data for prototype
  const [staff, setStaff] = useState<StaffProfile[]>(
    TEAM_MEMBERS.map((m, idx) => ({
      id: `staff-${idx}`,
      name: m.name,
      role: m.role,
      schedule: BUSINESS_HOURS.reduce((acc, curr) => {
        acc[curr.day] = curr.hours;
        return acc;
      }, {} as Record<string, string>),
      isActive: true
    }))
  );

  const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
  const [_isAdding, setIsAdding] = useState(false);

  const handleSave = (updated: StaffProfile) => {
    setStaff(staff.map(s => s.id === updated.id ? updated : s));
    setSelectedStaff(null);
  };

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-serif text-5xl mb-4 font-light text-black dark:text-white">{t('atelier.nav.staff_manager', { defaultValue: 'Staff Roster' })}</h2>
          <p className="text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest text-[11px]">{t('atelier.staff.subtitle', { defaultValue: 'Team & Availability Roster' })}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center gap-2"
        >
          <Plus size={14} /> {t('atelier.staff.add_member', { defaultValue: 'Add Specialist' })}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staff.map(member => (
          <motion.div 
            key={member.id}
            whileHover={{ y: -4 }}
            className="group relative bg-white dark:bg-[#1A1A1A] border border-zinc-100 dark:border-zinc-800 p-10 hover:border-black dark:hover:border-white transition-all cursor-pointer"
            onClick={() => setSelectedStaff(member)}
          >
            <div className="absolute top-10 right-10">
              <ShieldCheck size={16} className={member.isActive ? 'text-[#B8A070]' : 'text-zinc-200 dark:text-zinc-700'} />
            </div>
            
            <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 dark:text-zinc-600 mb-8 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
              <User size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="font-serif text-2xl italic text-black dark:text-white">{member.name}</h3>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">{t(`data.roles.${member.role}` as any, { defaultValue: member.role })}</p>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-50 dark:border-zinc-800 flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              <span className="flex items-center gap-2"><Clock size={12} /> {t('atelier.staff.schedule', { defaultValue: 'Schedule' })}</span>
              <span className="text-black dark:text-white font-bold">7 {t('data.days.Days', { defaultValue: 'Days' })}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#1A1A1A] shadow-2xl p-12 overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedStaff(null)}
                className="absolute top-8 right-8 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-black dark:text-white"
              >
                <X size={20} />
              </button>

              <div className="space-y-12">
                <header className="flex items-center gap-8 border-b border-zinc-100 dark:border-zinc-800 pb-12">
                  <div className="w-20 h-24 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-200 dark:text-zinc-700">
                    <User size={48} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <input 
                      type="text" 
                      value={selectedStaff.name} 
                      onChange={e => setSelectedStaff({...selectedStaff, name: e.target.value})}
                      className="font-serif text-4xl italic focus:outline-none w-full bg-transparent text-black dark:text-white border-b border-transparent focus:border-zinc-200"
                    />
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#B8A070] font-bold">{t(`data.roles.${selectedStaff.role}` as any, { defaultValue: selectedStaff.role })}</p>
                  </div>
                </header>

                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 dark:text-zinc-500">{t('atelier.staff.availability', { defaultValue: 'Availability Schedule' })}</h4>
                    <button className="text-[9px] uppercase tracking-widest text-[#B8A070] font-bold hover:underline">{t('atelier.staff.reset_default', { defaultValue: 'Reset to Studio Default' })}</button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(selectedStaff.schedule).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 transition-colors">
                        <span className="text-[10px] uppercase tracking-widest font-bold w-24 text-black dark:text-white">{t(`data.days.${day}` as any)}</span>
                        <input 
                          type="text" 
                          value={hours} 
                          onChange={e => {
                            const newSched = {...selectedStaff.schedule};
                            newSched[day] = e.target.value;
                            setSelectedStaff({...selectedStaff, schedule: newSched});
                          }}
                          className="flex-1 bg-transparent text-xs text-right focus:outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 px-2 text-zinc-600 dark:text-zinc-400"
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-8 flex gap-4">
                  <button 
                    onClick={() => handleSave(selectedStaff)}
                    className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={14} /> {t('atelier.staff.save', { defaultValue: 'Save Profile' })}
                  </button>
                  <button 
                    onClick={() => setSelectedStaff(null)}
                    className="px-8 py-4 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
                  >
                    {t('atelier.loyalty.cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

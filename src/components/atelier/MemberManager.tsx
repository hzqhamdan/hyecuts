import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, User as UserIcon, MoreHorizontal, ArrowUpDown, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../api/client';
import type { User } from '../../types/loyalty';
import { useAuth } from '../../context/AuthContext';

export function MemberManager() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);

  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ['members', token],
    queryFn: () =>
      api.get<User[]>('/admin/users', { token: token ?? undefined })
  });

  const adjustMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: string, amount: number }) =>
      api.post(`/admin/points/adjust/${userId}?points=${amount}`, { token: token ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', token] });
      // Update selected member if open
      if (selectedMember) {
        const updated = members.find(m => m.id === selectedMember.id);
        if (updated) setSelectedMember(updated);
      }
    }
  });

  const [isOverridingTier, setIsOverridingTier] = useState(false);

  const tierMutation = useMutation({
    mutationFn: ({ userId, tierName }: { userId: string, tierName: string }) =>
      api.post(`/admin/tier/override/${userId}?tier=${tierName}`, { token: token ?? undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['members', token] });
      setIsOverridingTier(false);
      // Update selected member if open
      if (selectedMember) {
        const updated = members.find(m => m.id === selectedMember.id);
        if (updated) setSelectedMember(updated);
      }
    }
  });

  const tiers = ['MEMBER', 'INSIDER', 'ARTISAN', 'CONNOISSEUR', 'PATRON'];

  const filteredMembers = members.filter(m => 
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="font-serif text-5xl mb-4 font-light text-black dark:text-white">{t('atelier.nav.member_manager')}</h2>
          <p className="text-zinc-400 dark:text-zinc-500 font-sans uppercase tracking-widest text-[11px]">{t('atelier.members.management_subtitle', { defaultValue: 'Registry & Portfolio Oversight' })}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder={t('atelier.members.search_placeholder', { defaultValue: 'Search by name or email...' })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sm focus:outline-none focus:border-black dark:focus:border-white text-black dark:text-white transition-all placeholder:text-zinc-400"
          />
        </div>
      </header>

      <div className="border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-[#1A1A1A] overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 font-bold">
              <th className="p-6 font-medium">{t('atelier.members.name', { defaultValue: 'Member' })}</th>
              <th className="p-6 font-medium">{t('atelier.members.tier', { defaultValue: 'Tier' })}</th>
              <th className="p-6 font-medium flex items-center gap-2">{t('atelier.members.points', { defaultValue: 'Points' })} <ArrowUpDown size={12} /></th>
              <th className="p-6 font-medium">{t('atelier.members.lifetime_points', { defaultValue: 'Lifetime' })}</th>
              <th className="p-6 font-medium text-right">{t('atelier.members.actions', { defaultValue: 'Actions' })}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
            {isLoading ? (
              <tr><td colSpan={5} className="p-20 text-center text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-xs">{t('lounge.retrieving_assets')}</td></tr>
            ) : filteredMembers.length === 0 ? (
              <tr><td colSpan={5} className="p-20 text-center text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-xs">{t('atelier.members.no_members', { defaultValue: 'No members found.' })}</td></tr>
            ) : filteredMembers.map(member => (
              <tr key={member.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <p className="font-serif text-lg italic text-black dark:text-white">{member.fullName || 'Anonymous'}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="text-[9px] uppercase tracking-widest px-2 py-1 border border-black/10 dark:border-white/10 font-bold text-black dark:text-white">
                    {t(`data.tiers.${member.tier ?? 'MEMBER'}`)}
                  </span>
                </td>
                <td className="p-6 font-mono text-sm text-black dark:text-white">
                  {(member.currentPoints ?? member.pointsBalance ?? 0).toLocaleString()}
                </td>
                <td className="p-6 font-mono text-sm text-zinc-400 dark:text-zinc-500">
                  {member.lifetimePoints?.toLocaleString() ?? '—'}
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setSelectedMember(member)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-all"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Member Detail Slide-over / Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1A1A] h-screen shadow-2xl p-12 overflow-y-auto"
          >
            <button 
              onClick={() => setSelectedMember(null)}
              className="absolute top-12 left-12 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-black dark:text-white"
            >
              <ArrowUpDown className="rotate-90" size={20} />
            </button>

            <div className="mt-20 space-y-16">
              <header className="text-center">
                <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-800 mx-auto mb-8 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                  <UserIcon size={48} />
                </div>
                <h3 className="font-serif text-4xl italic mb-2 text-black dark:text-white">{selectedMember.fullName}</h3>
                <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 dark:text-zinc-500 font-bold">{selectedMember.email}</p>
              </header>

              <div className="grid grid-cols-2 gap-px bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800">
                <div className="p-8 bg-white dark:bg-[#1A1A1A] text-center">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">{t('lounge.points_balance')}</p>
                  <p className="font-serif text-3xl text-black dark:text-white">{(selectedMember.currentPoints ?? selectedMember.pointsBalance ?? 0).toLocaleString()}</p>
                </div>
                <div className="p-8 bg-white dark:bg-[#1A1A1A] text-center">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">{t('lounge.tier_label')}</p>
                  <p className="font-serif text-3xl text-[#B8A070]">{t(`data.tiers.${selectedMember.tier ?? 'MEMBER'}`)}</p>
                </div>
              </div>

              <section className="space-y-8">
                <div className="flex items-center gap-3 border-b border-black dark:border-white pb-4">
                  <Shield size={16} className="text-[#B8A070]" />
                  <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-black dark:text-white">{t('atelier.members.adjust_points', { defaultValue: 'Manual Adjustment' })}</h4>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 italic">{t('atelier.members.adjustment_desc', { defaultValue: 'Add or deduct points from this portfolio.' })}</span>
                    <span className={`font-mono text-xl ${adjustAmount > 0 ? 'text-green-600' : adjustAmount < 0 ? 'text-red-600' : 'text-zinc-400'}`}>
                      {adjustAmount > 0 ? '+' : ''}{adjustAmount}
                    </span>
                  </div>
                  <input 
                    type="range" min="-1000" max="1000" step="50"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseInt(e.target.value))}
                    className="w-full h-px bg-zinc-200 dark:bg-zinc-800 rounded-none appearance-none cursor-pointer accent-black dark:accent-white"
                  />
                  <button 
                    onClick={() => {
                      adjustMutation.mutate({ userId: selectedMember.id, amount: adjustAmount });
                      setAdjustAmount(0);
                    }}
                    disabled={adjustAmount === 0 || adjustMutation.isPending}
                    className="w-full py-4 bg-black dark:bg-white text-white dark:text-black text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all disabled:opacity-30"
                  >
                    {adjustMutation.isPending ? t('login.processing') : t('atelier.members.apply_adjustment', { defaultValue: 'Confirm Adjustment' })}
                  </button>
                </div>
              </section>

              <section className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
                <AnimatePresence mode="wait">
                  {!isOverridingTier ? (
                    <motion.button 
                      key="override-btn"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setIsOverridingTier(true)}
                      className="w-full py-4 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 text-[10px] uppercase tracking-widest font-bold hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-all"
                    >
                      {t('atelier.members.override_tier', { defaultValue: 'Override Membership Tier' })}
                    </motion.button>
                  ) : (
                    <motion.div 
                      key="tier-selection"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <p className="text-[10px] uppercase tracking-widest font-bold text-center mb-4 text-black dark:text-white">{t('atelier.members.select_tier', { defaultValue: 'Select New Tier' })}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {tiers.map(tier => (
                          <button
                            key={tier}
                            onClick={() => tierMutation.mutate({ userId: selectedMember.id, tierName: tier })}
                            disabled={tierMutation.isPending || selectedMember.tier === tier}
                            className={`px-4 py-2 text-[9px] uppercase tracking-widest font-bold border transition-all ${
                              selectedMember.tier === tier 
                                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
                            } disabled:opacity-50`}
                          >
                            {t(`data.tiers.${tier}`)}
                          </button>
                        ))}
                      </div>
                      <button 
                        onClick={() => setIsOverridingTier(false)}
                        className="w-full py-2 text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                      >
                        {t('atelier.loyalty.cancel')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <p className="text-[9px] text-center text-zinc-400 dark:text-zinc-600 mt-4 italic">
                  {t('atelier.members.audit_note', { defaultValue: 'All manual adjustments are logged in the fulfillment archive.' })}
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Scissors, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import type { LoyaltyProfile } from '../../types/loyalty';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
  profile?: LoyaltyProfile | null;
  onProfileUpdate?: () => void;
}

type TabType = 'general' | 'hair' | 'security';

export default function UserProfileModal({ isOpen, onClose, onExportData, onDeleteAccount, profile, onProfileUpdate }: UserProfileModalProps) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Avatar handling
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar || null);

  // Form states
  const [formData, setFormData] = useState({
    username: profile?.username || user?.username || 'Client',
    fullName: profile?.fullName || 'Client',
    dob: profile?.dob || '1990-01-01',
    email: profile?.email || user?.username || 'client@hyecuts.com',
    phone: profile?.phone || '',
    hairType: profile?.hairType || 'straight',
    hairLength: profile?.hairLength || 'short',
    scalp: profile?.hairScalp || 'normal',
  });

  // Sync state when profile prop changes
  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || profile.email,
        fullName: profile.fullName || '',
        dob: profile.dob || '1990-01-01',
        email: profile.email,
        phone: profile.phone || '',
        hairType: profile.hairType || 'straight',
        hairLength: profile.hairLength || 'short',
        scalp: profile.hairScalp || 'normal',
      });
      setAvatarPreview(profile.avatar || null);
    }
  }, [profile]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image size must be less than 1MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setErrorMessage(null);
    try {
      await api.put(`/loyalty/profile/${user?.id}`, {
        body: {
          fullName: formData.fullName,
          email: formData.email.trim(),
          dob: formData.dob,
          phone: formData.phone,
          hairProfile: {
            type: formData.hairType,
            length: formData.hairLength,
            scalp: formData.scalp
          },
          avatar: avatarPreview
        },
        token: token ?? undefined
      });
      setIsSaved(true);
      onProfileUpdate?.();
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error: unknown) {
      console.error("Error updating profile", error);
      let msg = "Failed to update profile";
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          msg = errorData.message || msg;
        } catch {
          msg = error.message || msg;
        }
      }
      setErrorMessage(msg);
    }
  };

  const getInitials = (name: string) => {
    return name.trim().slice(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-0 sm:p-12"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-white dark:bg-[#1A1A1A] text-black dark:text-white w-full max-w-4xl max-h-[95vh] sm:h-[85vh] flex flex-col overflow-hidden shadow-2xl relative border border-black/10 dark:border-white/10 sm:rounded-none"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Mobile: compact profile row */}
          <div className="sm:hidden flex items-center gap-3 px-5 pt-5 pb-3 bg-neutral-50 dark:bg-zinc-900 border-b border-black/5 dark:border-white/5">
            <div className="relative group cursor-pointer shrink-0">
              <input type="file" accept="image/*" className="hidden" id="avatar-upload-mobile" onChange={handleImageChange} />
              <label htmlFor="avatar-upload-mobile" className="cursor-pointer block relative">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-black/10 dark:border-white/10" />
                ) : (
                  <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-serif text-sm rounded-full">
                    {getInitials(formData.fullName || formData.username)}
                  </div>
                )}
              </label>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-base uppercase tracking-tighter truncate">{formData.fullName || formData.username}</h2>
              <div className="text-[9px] uppercase tracking-widest text-zinc-500 truncate">{profile?.currentTier ?? t('lounge.tier_label')}</div>
            </div>
          </div>

          {/* Mobile: horizontal tab pills */}
          <nav className="sm:hidden flex gap-1 px-5 py-3 bg-neutral-50 dark:bg-zinc-900 border-b border-black/5 dark:border-white/5 overflow-x-auto">
            {([
              { key: 'general' as TabType, icon: <User className="w-3.5 h-3.5" />, label: t('profile_modal.tabs.general') },
              { key: 'hair' as TabType, icon: <Scissors className="w-3.5 h-3.5" />, label: t('profile_modal.tabs.hair') },
              { key: 'security' as TabType, icon: <ShieldAlert className="w-3.5 h-3.5" />, label: t('profile_modal.tabs.security') },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded text-[9px] font-bold uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Desktop sidebar + content row */}
          <div className="flex flex-1 flex-col sm:flex-row overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden sm:flex sm:w-1/3 bg-neutral-50 dark:bg-zinc-900 border-r border-black/10 dark:border-white/10 p-6 lg:p-8 flex-col">
              <div className="mb-8 flex items-center gap-3 lg:gap-4">
                <div className="relative group cursor-pointer shrink-0">
                  <input type="file" accept="image/*" className="hidden" id="avatar-upload" onChange={handleImageChange} />
                  <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-14 h-14 lg:w-16 lg:h-16 rounded-full object-cover border border-black/10 dark:border-white/10" />
                    ) : (
                      <div className="w-14 h-14 lg:w-16 lg:h-16 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-serif text-lg lg:text-xl rounded-full">
                        {getInitials(formData.fullName || formData.username)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-[8px] uppercase tracking-widest">Edit</span>
                    </div>
                  </label>
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-xl lg:text-2xl uppercase tracking-tighter truncate">{formData.fullName || formData.username}</h2>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 truncate">{profile?.currentTier ?? t('lounge.tier_label')}</div>
                </div>
              </div>

              <nav className="flex flex-col gap-1.5">
                {([
                  { key: 'general' as TabType, icon: <User className="w-4 h-4" />, label: t('profile_modal.tabs.general') },
                  { key: 'hair' as TabType, icon: <Scissors className="w-4 h-4" />, label: t('profile_modal.tabs.hair') },
                  { key: 'security' as TabType, icon: <ShieldAlert className="w-4 h-4" />, label: t('profile_modal.tabs.security') },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-3 text-left p-3 lg:p-4 transition-colors ${
                      activeTab === tab.key
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 sm:p-8 lg:p-12 overflow-y-auto relative pb-24 sm:pb-8">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 sm:space-y-8"
                  >
                    <h3 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
                      {t('profile_modal.tabs.general')}
                    </h3>

                    <div className="space-y-5 sm:space-y-6">
                      {errorMessage && (
                        <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold text-center">
                          {errorMessage}
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.name')}</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.dob')}</label>
                        <input
                          type="date"
                          value={formData.dob}
                          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                          className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.email')}</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 sm:gap-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.phone')}</label>
                        <div className="flex items-center border-b border-black/20 dark:border-white/20">
                          <span className="text-sm text-zinc-400 dark:text-zinc-600 mr-2">+60</span>
                          <input
                            type="tel"
                            value={formData.phone.replace(/^\+60\s?/, '')}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length > 9) val = val.substring(0, 9);
                              let formatted = val;
                              if (val.length > 2) formatted = val.substring(0, 2) + '-' + val.substring(2);
                              if (val.length > 5) formatted = val.substring(0, 2) + '-' + val.substring(2, 5) + ' ' + val.substring(5);
                              setFormData({ ...formData, phone: `+60 ${formatted}` });
                            }}
                            placeholder="12-345 6789"
                            className="bg-transparent py-2 text-sm focus:outline-none w-full transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'hair' && (
                  <motion.div
                    key="hair"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 sm:space-y-8"
                  >
                    <h3 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
                      {t('profile_modal.tabs.hair')}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {t('profile_modal.hair.description')}
                    </p>

                    <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:gap-8">
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.hair.type')}</label>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                          {['straight', 'wavy', 'curly', 'coily'].map((type) => (
                            <label key={type} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${formData.hairType === type ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-black/50 dark:group-hover:border-white/50'}`}>
                                {formData.hairType === type && <div className="w-2 h-2 bg-black dark:bg-[#B8A070] rounded-full" />}
                              </div>
                              <span className="text-sm">{t(`profile_modal.hair.type_options.${type}`)}</span>
                              <input type="radio" name="hairType" value={type} checked={formData.hairType === type} onChange={() => setFormData({ ...formData, hairType: type })} className="hidden" />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:gap-3">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.hair.length')}</label>
                        <div className="flex flex-col gap-1.5 sm:gap-2">
                          {['short', 'medium', 'long'].map((len) => (
                            <label key={len} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${formData.hairLength === len ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-black/50 dark:group-hover:border-white/50'}`}>
                                {formData.hairLength === len && <div className="w-2 h-2 bg-black dark:bg-[#B8A070] rounded-full" />}
                              </div>
                              <span className="text-sm">{t(`profile_modal.hair.length_options.${len}`)}</span>
                              <input type="radio" name="hairLength" value={len} checked={formData.hairLength === len} onChange={() => setFormData({ ...formData, hairLength: len })} className="hidden" />
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:gap-3 sm:col-span-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.hair.scalp')}</label>
                        <div className="flex flex-row flex-wrap gap-4 sm:gap-6">
                          {['normal', 'dry', 'oily', 'sensitive'].map((s) => (
                            <label key={s} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors shrink-0 ${formData.scalp === s ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-black/50 dark:group-hover:border-white/50'}`}>
                                {formData.scalp === s && <div className="w-2 h-2 bg-black dark:bg-[#B8A070] rounded-full" />}
                              </div>
                              <span className="text-sm">{t(`profile_modal.hair.scalp_options.${s}`)}</span>
                              <input type="radio" name="scalp" value={s} checked={formData.scalp === s} onChange={() => setFormData({ ...formData, scalp: s })} className="hidden" />
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 sm:space-y-8"
                  >
                    <h3 className="font-serif text-2xl sm:text-3xl uppercase tracking-tighter border-b border-black/10 dark:border-white/10 pb-3 sm:pb-4">
                      {t('profile_modal.tabs.security')}
                    </h3>

                    <div className="space-y-6 sm:space-y-8">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-3 sm:mb-4">{t('profile_modal.security.change_password')}</h4>
                        <button className="bg-transparent border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 py-3 px-5 sm:px-6 text-[10px] uppercase tracking-widest transition-colors">
                          {t('profile_modal.security.change_password')}
                        </button>
                      </div>

                      <div className="pt-6 sm:pt-8 border-t border-black/5 dark:border-white/5">
                        <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5 sm:mb-6">
                          {t('profile_modal.security.pdpa_description')}
                        </p>

                        <div className="space-y-3 sm:space-y-4">
                          <button
                            onClick={onExportData}
                            className="w-full text-left p-3 sm:p-4 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors"
                          >
                            <div className="text-[10px] uppercase tracking-widest font-bold mb-1">{t('profile_modal.security.export_data')}</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('profile_modal.security.export_data_desc')}</div>
                          </button>

                          <button
                            onClick={onDeleteAccount}
                            className="w-full text-left p-3 sm:p-4 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                          >
                            <div className="text-[10px] uppercase tracking-widest font-bold text-red-600 dark:text-red-500 mb-1">{t('profile_modal.security.delete_account')}</div>
                            <div className="text-xs text-red-500/80 dark:text-red-400/80 group-hover:text-red-500 dark:group-hover:text-red-400">{t('profile_modal.security.delete_account_desc')}</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Save Button */}
              {activeTab !== 'security' && (
                <div className="fixed sm:absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-white via-white to-transparent dark:from-[#1A1A1A] dark:via-[#1A1A1A] flex justify-end z-10">
                  <button
                    onClick={handleSave}
                    className="w-full sm:w-auto bg-black dark:bg-white text-white dark:text-black py-3.5 sm:py-4 px-6 sm:px-8 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        {t('profile_modal.general.success')}
                      </>
                    ) : (
                      t('profile_modal.general.save')
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

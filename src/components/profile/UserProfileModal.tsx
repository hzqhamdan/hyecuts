import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Scissors, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../config';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportData: () => void;
  onDeleteAccount: () => void;
}

type TabType = 'general' | 'hair' | 'security';

export default function UserProfileModal({ isOpen, onClose, onExportData, onDeleteAccount }: UserProfileModalProps) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Avatar handling
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form states
  const [formData, setFormData] = useState({
    username: user?.username || 'Client',
    fullName: user?.username || 'Client',
    dob: '1990-01-01',
    email: 'client@hyecuts.com',
    phone: '+60 12-345 6789',
    hairType: 'straight',
    hairLength: 'short',
    scalp: 'normal',
  });
  
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/loyalty/profile/${user?.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          dob: formData.dob,
          phone: formData.phone,
          hairProfile: {
            type: formData.hairType,
            length: formData.hairLength,
            scalp: formData.scalp
          },
          avatar: avatarPreview
        })
      });
      
      if (res.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile", error);
    }
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-12"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className="bg-white dark:bg-[#1A1A1A] text-black dark:text-white w-full max-w-4xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border border-black/10 dark:border-white/10"
        >
          {/* Close button - Absolute positioned for both mobile/desktop */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-20 text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Sidebar Navigation */}
          <div className="md:w-1/3 w-full bg-neutral-50 dark:bg-zinc-900 border-r border-black/10 dark:border-white/10 p-8 flex flex-col">
            <div className="mb-12 mt-4 md:mt-0 flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="avatar-upload" 
                  onChange={handleImageChange} 
                />
                <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-16 h-16 rounded-full object-cover border border-black/10 dark:border-white/10" 
                    />
                  ) : (
                    <div className="w-16 h-16 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-serif text-xl rounded-full">
                      {getInitials(formData.username)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[8px] uppercase tracking-widest">Edit</span>
                  </div>
                </label>
              </div>
              <div>
                <h2 className="font-serif text-2xl uppercase tracking-tighter">{formData.username}</h2>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500">{t('lounge.tier_label')}</div>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-3 text-left p-4 transition-colors ${
                  activeTab === 'general'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('profile_modal.tabs.general')}</span>
              </button>

              <button
                onClick={() => setActiveTab('hair')}
                className={`flex items-center gap-3 text-left p-4 transition-colors ${
                  activeTab === 'hair'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('profile_modal.tabs.hair')}</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 text-left p-4 transition-colors ${
                  activeTab === 'security'
                    ? 'bg-black text-white dark:bg-white dark:text-black'
                    : 'text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{t('profile_modal.tabs.security')}</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="md:w-2/3 w-full p-8 md:p-12 overflow-y-auto flex-1 relative">
            <AnimatePresence mode="wait">
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <h3 className="font-serif text-3xl uppercase tracking-tighter border-b border-black/10 dark:border-white/10 pb-4">
                    {t('profile_modal.tabs.general')}
                  </h3>

                  <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.username')}</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.name')}</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.dob')}</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.general.email')}</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-transparent border-b border-black/20 dark:border-white/20 py-2 text-sm focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
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
                            if (val.length > 2) {
                              formatted = val.substring(0, 2) + '-' + val.substring(2);
                            }
                            if (val.length > 5) {
                              formatted = val.substring(0, 2) + '-' + val.substring(2, 5) + ' ' + val.substring(5);
                            }
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
                  className="space-y-8"
                >
                  <h3 className="font-serif text-3xl uppercase tracking-tighter border-b border-black/10 dark:border-white/10 pb-4">
                    {t('profile_modal.tabs.hair')}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {t('profile_modal.hair.description')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Hair Type */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.hair.type')}</label>
                      <div className="flex flex-col gap-2">
                        {['straight', 'wavy', 'curly', 'coily'].map((type) => (
                          <label key={type} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.hairType === type ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-black/50 dark:group-hover:border-white/50'}`}>
                              {formData.hairType === type && <div className="w-2 h-2 bg-black dark:bg-[#B8A070] rounded-full" />}
                              </div>                            <span className="text-sm">{t(`profile_modal.hair.type_options.${type}`)}</span>
                            <input 
                              type="radio" 
                              name="hairType" 
                              value={type} 
                              checked={formData.hairType === type}
                              onChange={() => setFormData({ ...formData, hairType: type })}
                              className="hidden" 
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Hair Length */}
                    <div className="flex flex-col gap-3">
                      <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.hair.length')}</label>
                      <div className="flex flex-col gap-2">
                        {['short', 'medium', 'long'].map((len) => (
                          <label key={len} className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.hairLength === len ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-black/50 dark:group-hover:border-white/50'}`}>
                              {formData.hairLength === len && <div className="w-2 h-2 bg-black dark:bg-[#B8A070] rounded-full" />}
                              </div>
                              <span className="text-sm">{t(`profile_modal.hair.length_options.${len}`)}</span>
                              <input
                              type="radio"
                              name="hairLength"
                              value={len}
                              checked={formData.hairLength === len}
                              onChange={() => setFormData({ ...formData, hairLength: len })}
                              className="hidden"
                              />
                              </label>
                              ))}
                              </div>
                              </div>

                              {/* Scalp Condition */}
                              <div className="flex flex-col gap-3 md:col-span-2">
                              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{t('profile_modal.hair.scalp')}</label>
                              <div className="flex flex-row flex-wrap gap-6">
                              {['normal', 'dry', 'oily', 'sensitive'].map((s) => (
                              <label key={s} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${formData.scalp === s ? 'border-black dark:border-white' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-black/50 dark:group-hover:border-white/50'}`}>
                              {formData.scalp === s && <div className="w-2 h-2 bg-black dark:bg-[#B8A070] rounded-full" />}
                              </div>                            <span className="text-sm">{t(`profile_modal.hair.scalp_options.${s}`)}</span>
                            <input 
                              type="radio" 
                              name="scalp" 
                              value={s} 
                              checked={formData.scalp === s}
                              onChange={() => setFormData({ ...formData, scalp: s })}
                              className="hidden" 
                            />
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
                  className="space-y-8"
                >
                  <h3 className="font-serif text-3xl uppercase tracking-tighter border-b border-black/10 dark:border-white/10 pb-4">
                    {t('profile_modal.tabs.security')}
                  </h3>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4">{t('profile_modal.security.change_password')}</h4>
                      <button className="bg-transparent border border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 py-3 px-6 text-[10px] uppercase tracking-widest transition-colors">
                        {t('profile_modal.security.change_password')}
                      </button>
                    </div>

                    <div className="pt-8 border-t border-black/5 dark:border-white/5">
                      <p className="font-sans text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                        {t('profile_modal.security.pdpa_description')}
                      </p>
                      
                      <div className="space-y-4">
                        <button 
                          onClick={onExportData}
                          className="w-full text-left p-4 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <div className="text-[10px] uppercase tracking-widest font-bold mb-1">{t('profile_modal.security.export_data')}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('profile_modal.security.export_data_desc')}</div>
                        </button>
                        
                        <button 
                          onClick={onDeleteAccount}
                          className="w-full text-left p-4 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
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

            {/* Save Button (Sticky bottom in content area) */}
            {activeTab !== 'security' && (
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white to-transparent dark:from-[#1A1A1A] dark:via-[#1A1A1A] flex justify-end">
                <button
                  onClick={handleSave}
                  className="bg-black dark:bg-white text-white dark:text-black py-4 px-8 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center gap-2"
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
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

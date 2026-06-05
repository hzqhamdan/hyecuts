import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Award, Sparkles, ChevronRight, Activity, Target, Globe, Bell, Menu, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import UserProfileModal from './components/profile/UserProfileModal';

interface LoyaltyProfile {
  userId: string;
  pointsBalance: number;
  currentTier: string;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  type: string;
  pointsCost: number;
  minimumTierRequired: string;
  stockAvailable: number | null;
}

interface ActivityLog {
  id: number;
  actionType: string;
  description: string;
  pointsEarned: number;
  timestamp: string;
}

interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface UserBadge {
  id: number;
  badgeId: number;
  earnedAt: string;
}

interface Mission {
  id: number;
  title: string;
  description: string;
  type: string;
  rewardPoints: number;
  targetAction: string;
  requiredCount: number;
}

interface UserMissionProgress {
  id: number;
  missionId: number;
  currentProgress: number;
  completed: boolean;
}

const MemberLounge = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, token, logout } = useAuth();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    void i18n.changeLanguage(newLang);
  };
  // Use real user ID if authenticated, fallback to a valid UUID if not for demo purposes
  const USER_ID = user?.id ?? "00000000-0000-0000-0000-000000000000";
  
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionProgress, setMissionProgress] = useState<UserMissionProgress[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [selectedVoucher, setSelectedVoucher] = useState<Reward | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mock notifications for prototype
  const notifications = [
    { id: 1, title: 'Tier Upgraded', message: 'Welcome to Legend tier. Enjoy your new perks.', isRead: false, time: '2h ago' },
    { id: 2, title: 'Reward Redeemed', message: 'Complimentary Hair Cut applied successfully.', isRead: true, time: '1d ago' },
  ];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const profileData = await api.get<{ id: string; currentPoints: number; tier?: { name: string } }>(`/loyalty/profile/${USER_ID}`);
        setProfile({
          userId: profileData.id,
          pointsBalance: profileData.currentPoints,
          currentTier: profileData.tier ? profileData.tier.name : 'Rookie'
        });

        const [rewardsData, activitiesData] = await Promise.all([
          api.get<Reward[]>('/rewards'),
          api.get<ActivityLog[]>(`/gamification/activity/${USER_ID}`)
        ]);
        setRewards(rewardsData);
        setActivities(activitiesData);

        const [badgesData, userBadgesData] = await Promise.all([
          api.get<Badge[]>('/gamification/badges'),
          api.get<UserBadge[]>(`/gamification/badges/${USER_ID}`)
        ]);
        setBadges(badgesData);
        setUserBadges(userBadgesData);

        const [mDaily, mWeekly, umpData] = await Promise.all([
          api.get<Mission[]>('/gamification/missions/type/DAILY'),
          api.get<Mission[]>('/gamification/missions/type/WEEKLY'),
          api.get<UserMissionProgress[]>(`/gamification/missions/${USER_ID}`)
        ]);
        setMissions([...mDaily, ...mWeekly]);
        setMissionProgress(umpData);

      } catch (error) {
        console.error("Error fetching loyalty data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [USER_ID]);

  const handleRedeem = async (rewardId: number) => {
    setRedemptionStatus('loading');
    try {
      await api.post(`/rewards/redeem/${USER_ID}/${rewardId.toString()}`);
      setRedemptionStatus('success');
      const profileData = await api.get<LoyaltyProfile>(`/loyalty/profile/${USER_ID}`);
      setProfile(profileData);
    } catch {
      setRedemptionStatus('error');
    }
  };

  const getTierProgress = (points: number, tier: string) => {
    let min = 0, max = 1000;
    let nextTier = 'Regular';
    
    if (tier === 'Icon') {
      return { percentage: 100, nextTier: t('lounge.max_tier', { defaultValue: 'Max Tier' }) };
    }
    
    if (tier === 'Master') { min = 5000; max = 10000; nextTier = 'Icon'; }
    else if (tier === 'Legend') { min = 2500; max = 5000; nextTier = 'Master'; }
    else if (tier === 'Regular') { min = 1000; max = 2500; nextTier = 'Legend'; }
    else { min = 0; max = 1000; nextTier = 'Regular'; }
    
    const percentage = Math.min(100, Math.max(0, ((points - min) / (max - min)) * 100));
    return { percentage, nextTier };
  };

  const progressData = profile ? getTierProgress(profile.pointsBalance, profile.currentTier) : { percentage: 0, nextTier: '...' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen bg-white dark:bg-[#1A1A1A] text-black dark:text-[#FAFAFA] px-6 md:px-12 py-10 md:py-16 font-sans overflow-x-hidden transition-colors duration-500"
    >
      {/* Navigation Header */}
      <nav className="max-w-7xl mx-auto mb-16 md:mb-24 flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
        <div className="flex justify-between items-center w-full md:w-auto">
          <button onClick={() => { navigate('/'); }}
            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> {t('nav.return_facade')}
          </button>
          
          <div className="md:hidden font-serif text-xl tracking-tighter uppercase font-medium italic">
            {t('lounge.title')}
          </div>

          <button 
            className="md:hidden p-2 text-zinc-500 dark:text-zinc-400 active:scale-90 transition-transform" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div className="hidden md:block font-serif text-2xl tracking-tighter uppercase font-medium italic">
          {t('lounge.title')}
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-4 md:gap-8">
          <button
            onClick={() => { navigate('/booking'); }}
            className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
          >
            {t('nav.book')}
          </button>
          <button
            onClick={() => { navigate('/my-bookings'); }}
            className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
          >
            {t('nav.appointments')}
          </button>
          <button
            onClick={() => { setShowSettingsModal(true); }}
            className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold"
          >
            {t('nav.profile')}
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#1A1A1A]"></span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-black/5 dark:border-white/5 bg-neutral-50 dark:bg-zinc-900/50">
                    <h4 className="font-serif text-sm uppercase tracking-widest">Notifications</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[10px] uppercase tracking-widest text-zinc-500">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-neutral-50 dark:hover:bg-zinc-900/50 transition-colors ${!notif.isRead ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h5 className="text-xs font-bold uppercase tracking-widest">{notif.title}</h5>
                            <span className="text-[9px] text-zinc-500 uppercase">{notif.time}</span>
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">{notif.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="text-[10px] uppercase tracking-widest text-red-400 dark:text-red-500 hover:text-red-600 transition-colors font-bold"
          >
            {t('nav.logout')}
          </button>
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors font-bold border-l border-zinc-200 dark:border-zinc-800 pl-6 ml-auto md:ml-0"
          >
            {i18n.language === 'en' ? <Globe size={12} /> : <img src="/flags/my.svg" alt="Malaysia" className="w-4 h-3 rounded-sm" />}
            {i18n.language === 'en' ? 'EN' : 'MY'}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white dark:bg-[#1A1A1A] pt-32 px-10 flex flex-col gap-8 text-center md:hidden transition-colors"
          >
            <button
              onClick={() => { setIsMenuOpen(false); navigate('/booking'); }}
              className="text-4xl font-serif italic tracking-tight capitalize"
            >
              {t('nav.book')}
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); navigate('/my-bookings'); }}
              className="text-4xl font-serif italic tracking-tight capitalize"
            >
              {t('nav.appointments')}
            </button>
            <button
              onClick={() => { setIsMenuOpen(false); setShowSettingsModal(true); }}
              className="text-4xl font-serif italic tracking-tight capitalize"
            >
              {t('nav.profile')}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                toggleLanguage();
              }}
              className="text-4xl font-serif italic tracking-tight capitalize"
            >
              {i18n.language === 'en' ? 'Bahasa Malaysia' : 'English'}
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                logout();
                navigate('/');
              }}
              className="mt-4 text-2xl font-serif italic tracking-tight capitalize text-red-500"
            >
              {t('nav.logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">

        {/* SECTION 1: STATUS CARD (The Centerpiece) */}
        <section className="lg:w-1/3 flex flex-col items-center">
          <div className="w-full max-w-sm flex flex-col items-center bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 px-8 py-12 md:py-16">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 font-sans mb-4">{t('lounge.tier_label')}</span>
            <h2 className="font-serif text-[32px] md:text-[40px] text-black dark:text-white text-center">
              {isLoading ? '...' : t('data.tiers.' + (profile?.currentTier ?? 'Rookie'))}
            </h2>

            {/* The Hairline Progress Arc */}
            <div className="mt-10 md:mt-12 relative w-48 h-24 overflow-hidden flex justify-center">
              <svg className="w-48 h-48 absolute top-0" viewBox="0 0 192 192">
                <path
                  d="M 24 96 A 72 72 0 0 1 168 96"
                  stroke="currentColor" 
                  className="text-zinc-100 dark:text-zinc-800"
                  strokeWidth="1"
                  fill="transparent"
                />
                <motion.path
                  d="M 24 96 A 72 72 0 0 1 168 96"
                  stroke="currentColor" 
                  className="text-black dark:text-[#B8A070]"
                  strokeWidth="1"
                  fill="transparent"
                  strokeDasharray="226.2"
                  initial={{ strokeDashoffset: 226.2 }}
                  animate={{ strokeDashoffset: 226.2 - (226.2 * progressData.percentage) / 100 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 50, duration: 0.8 }}
                />
              </svg>
            </div>
            
            <div className="mt-8 text-center">
              <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-[240px]">
                {t('lounge.tier_description')}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: REWARD PORTFOLIO */}
        <section className="lg:w-2/3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter mb-2">{t('lounge.portfolio_title')}</h3>
              <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm tracking-wide">{t('lounge.portfolio_subtitle')}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest border-b border-black dark:border-white pb-1">
                {rewards.length} {t('lounge.available_assets')}
              </span>
            </div>
          </div>

          {/* Editorial Layout Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-10 md:gap-y-16">
            {isLoading ? (
              <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-widest">
                {t('lounge.retrieving_assets')}
              </div>
            ) : rewards.length === 0 ? (
              <div className="col-span-full text-center py-12 text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-widest">
                {t('lounge.no_rewards')}
              </div>
            ) : rewards.map((reward, idx) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedVoucher(reward);
                  setRedemptionStatus('idle');
                }}
              >
                <div className="relative overflow-hidden aspect-[1.6/1] bg-white dark:bg-[#1A1A1A] border border-black/10 dark:border-white/10 p-6 md:p-8 flex flex-col justify-between transition-all duration-500 group-hover:shadow-xl dark:group-hover:shadow-black/50 group-hover:border-black dark:group-hover:border-white">

                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
                      <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold">
                        {reward.minimumTierRequired ? `${t('data.tiers.' + reward.minimumTierRequired)} ` : ''}{t('lounge.any_tier')} Tier
                      </span>
                    </div>
                    <Sparkles className="w-4 h-4 opacity-20 dark:opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Middle Content Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                    <div className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-700 font-bold">
                      {t('lounge.reveal_invitation')} <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h4 className="font-serif text-lg md:text-xl uppercase tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {t(`data.rewards.${reward.title}.title`, { defaultValue: reward.title })}
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed max-w-xs line-clamp-2 mb-3">
                      {t(`data.rewards.${reward.title}.description`, { defaultValue: reward.description })}
                    </p>
                    <div className="font-mono text-[9px] md:text-[10px] tracking-widest text-zinc-500 dark:text-zinc-500 uppercase font-bold">
                      {(reward.pointsCost ?? 0).toString()} {t('lounge.pts')} {reward.stockAvailable !== null && `• ${(reward.stockAvailable ?? 0).toString()} ${t('lounge.left')}`}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Recent Activity Feed */}
          {activities.length > 0 && (
            <div className="mt-20 md:mt-24">
              <h3 className="font-serif text-xl md:text-2xl uppercase tracking-tighter mb-8 border-b border-black/10 dark:border-white/10 pb-4">{t('lounge.activity_title')}</h3>
              <div className="space-y-3">
                {activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex justify-between items-center p-4 bg-neutral-50 dark:bg-zinc-900 border border-neutral-100 dark:border-zinc-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <Activity className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                      <div>
                        <p className="text-xs md:text-sm font-bold">{act.description}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mt-1">
                          {new Date(act.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-mono text-xs md:text-sm font-bold ${act.pointsEarned > 0 ? 'text-green-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      {act.pointsEarned > 0 ? '+' : ''}{act.pointsEarned.toString()} {t('lounge.pts')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SECTION 3: MISSIONS & BADGES */}
      <div className="max-w-7xl mx-auto mt-20 md:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 border-t border-black/10 dark:border-white/10 pt-16 md:pt-24 pb-16 md:pb-24">
        
        {/* Active Missions */}
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter mb-2">{t('lounge.directives_title')}</h3>
              <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm tracking-wide">{t('lounge.directives_subtitle')}</p>
            </div>
            <Target className="w-6 h-6 opacity-40 dark:opacity-60" />
          </div>

          <div className="space-y-4">
            {missions.length === 0 ? (
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-500">{t('lounge.no_directives')}</div>
            ) : (
              missions.slice(0, 3).map(mission => {
                const prog = missionProgress.find(p => p.missionId === mission.id) ?? { currentProgress: 0, completed: false };

                return (
                    <div key={mission.id} className="py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center group">
                      <div className={`flex items-start gap-4 ${prog.completed ? 'opacity-30' : ''} w-full`}>
                        <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full mt-1.5 shrink-0" />
                        <div className="flex-1 w-full max-w-xs">
                          <h4 className={`font-sans text-xs md:text-sm uppercase tracking-widest font-bold text-black dark:text-white ${prog.completed ? 'line-through' : ''}`}>
                            {mission.title}
                          </h4>
                          {!prog.completed && (
                            <div className="mt-3">
                              <div className="w-full h-1 bg-neutral-200 dark:bg-zinc-800 overflow-hidden relative">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(100, ((prog.currentProgress ?? 0) / (mission.requiredCount || 1)) * 100)}%` }}
                                  transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                  className="absolute top-0 left-0 h-full bg-black dark:bg-[#B8A070]"
                                />
                              </div>
                              <div className="text-[9px] md:text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-2 flex justify-between items-center font-bold">
                                <span>{(prog.currentProgress ?? 0).toString()} / {(mission.requiredCount ?? 0).toString()} {mission.targetAction}</span>
                                <span className="font-mono text-black dark:text-white">+{(mission.rewardPoints ?? 0).toString()} {t('lounge.pts')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                );
              })
            )}
          </div>
        </section>

        {/* Badge Showcase */}
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h3 className="font-serif text-3xl md:text-4xl uppercase tracking-tighter mb-2">{t('lounge.archive_title')}</h3>
              <p className="font-sans text-zinc-500 dark:text-zinc-400 text-sm tracking-wide">{t('lounge.archive_subtitle')}</p>
            </div>
            <Award className="w-6 h-6 opacity-40 dark:opacity-60" />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-3 md:gap-4">
              {badges.slice(0, 5).map(badge => {
                const unlocked = userBadges.some(ub => ub.badgeId === badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`px-4 md:px-6 py-3 md:py-4 border transition-all ${
                      unlocked ? 'border-black dark:border-white text-black dark:text-white bg-white dark:bg-[#1A1A1A]' : 'border-neutral-200 dark:border-zinc-800 text-neutral-400 dark:text-zinc-600 opacity-40 bg-white dark:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="font-serif text-xs md:text-sm uppercase tracking-widest leading-none">{badge.name}</div>
                  </div>
                );
              })}
            </div>

          <div className="mt-2">
            <a href="#" className="text-[10px] md:text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white border-b border-transparent hover:border-black dark:hover:border-white transition-colors font-bold">
              {t('lounge.view_collection')}
            </a>
          </div>
          </div>
        </section>
      </div>

      {/* SIGNATURE TRANSITION: Voucher Modal */}
      
        {selectedVoucher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
            <div className="bg-[#F9F9F7] dark:bg-[#1A1A1A] w-full max-w-lg relative overflow-hidden shadow-2xl">
              {/* Luxury Invitation Styling */}
              <div className="p-12 flex flex-col items-center text-center bg-repeat">
                <div className="w-full border-t border-b border-black dark:border-white py-8 mb-12">
                  <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-zinc-500 dark:text-zinc-400 block mb-4">{t('lounge.exclusive_invitation')}</span>
                  <h2 className="font-serif text-4xl uppercase tracking-tighter mb-2">{t('common.the_studio')}</h2>
                  <div className="h-px w-12 bg-black dark:bg-white mx-auto mt-6" />
                </div>

                <div className="relative group mb-12">
                  {/* Physical Card Feel */}
                  <div className="bg-neutral-50 dark:bg-zinc-900 border border-black/20 dark:border-white/10 p-10 flex flex-col items-center gap-8 w-72 shadow-sm transition-colors">
                    <div className="bg-black dark:bg-white p-6 rounded-none transition-colors">
                      <Award className="w-20 h-20 text-white dark:text-black" />
                    </div>
                    <div className="space-y-2">
                      <div className="font-serif text-lg uppercase tracking-tight leading-tight text-black dark:text-white">{selectedVoucher.title}</div>
                      <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 tracking-widest">
                        {t('lounge.cost')}: {selectedVoucher.pointsCost.toString()} {t('lounge.pts')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                  {redemptionStatus === 'success' ? (
                    <div className="py-4 text-[10px] uppercase tracking-widest text-green-700 dark:text-green-400 font-bold border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
                      {t('lounge.redemption_confirmed')}
                    </div>
                  ) : redemptionStatus === 'error' ? (
                    <div className="py-4 text-[10px] uppercase tracking-widest text-red-700 dark:text-red-400 font-bold border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10">
                      {t('lounge.insufficient_points')}
                    </div>
                  ) : (
                    <button onClick={() => { void handleRedeem(selectedVoucher.id); }}
                      disabled={redemptionStatus === 'loading'}
                      className="bg-black dark:bg-white text-white dark:text-black py-4 text-[10px] uppercase tracking-widest hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                    >
                      {redemptionStatus === 'loading' ? t('login.processing') : t('lounge.redeem_asset')}
                    </button>
                  )}
                  
                  <button
                    onClick={() => { setSelectedVoucher(null); }}
                    className="text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors mt-2"
                  >
                    {t('lounge.close_portfolio')}
                  </button>
                </div>
              </div>

              {/* Decorative Corner Elements */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-black/10 dark:border-white/10" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-black/10 dark:border-white/10" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-black/10 dark:border-white/10" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-black/10 dark:border-white/10" />
            </div>
          </div>
        )}

      {/* PDPA Privacy & Data Export Modal */}
      <UserProfileModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onExportData={() => {
          if(profile) {
            const fullExport = {
              profile,
              activities,
              badges: badges.filter(b => userBadges.some(ub => ub.badgeId === b.id)),
              missions: missions.map(m => ({
                ...m,
                progress: missionProgress.find(p => p.missionId === m.id)
              })),
              exportedAt: new Date().toISOString(),
              studio: "The Studio by Hyecuts"
            };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullExport, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `thestudio_export_${profile.userId.slice(0,8)}.json`);
            dlAnchorElem.click();
          }
        }}
        onDeleteAccount={async () => {
          if(confirm(t('lounge.delete_confirm'))) {
            try {
              await api.del(`/admin/users/${user?.id}`, { token: token ?? undefined });
              alert(t('lounge.delete_submitted'));
              logout();
              navigate('/');
            } catch (error) {
              console.error('Failed to delete account', error);
            }
          }
        }}
      />
      
    </motion.div>
  );
};

export default MemberLounge;

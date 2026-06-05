import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { useAuth } from './context/AuthContext';
import { api } from './api/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import type { LoyaltyProfile, Reward, ActivityLog, Badge, UserBadge, Mission, UserMissionProgress } from './types/loyalty';
import UserProfileModal from './components/profile/UserProfileModal';
import LoungeHeader from './components/lounge/LoungeHeader';
import MobileMenu from './components/lounge/MobileMenu';
import StatusCard from './components/lounge/StatusCard';
import RewardPortfolio from './components/lounge/RewardPortfolio';
import ActivityFeed from './components/lounge/ActivityFeed';
import MissionsPanel from './components/lounge/MissionsPanel';
import BadgeShowcase from './components/lounge/BadgeShowcase';
import VoucherModal from './components/member-lounge/VoucherModal';

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
        const profileData = await api.get<any>(`/loyalty/profile/${USER_ID}`);
        setProfile({
          userId: profileData.id,
          email: profileData.email,
          fullName: profileData.fullName || '',
          pointsBalance: profileData.currentPoints,
          currentTier: profileData.tier ? profileData.tier.name : 'Rookie',
          dob: profileData.dob || '1990-01-01',
          phone: profileData.phone || '',
          hairType: profileData.hairType || 'straight',
          hairLength: profileData.hairLength || 'short',
          hairScalp: profileData.hairScalp || 'normal',
          avatar: profileData.avatar || null
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
      <LoungeHeader
        onLogout={() => { logout(); navigate('/'); }}
        onToggleLanguage={toggleLanguage}
        showNotifications={showNotifications}
        onToggleNotifications={() => { setShowNotifications(!showNotifications); }}
        onOpenSettings={() => { setShowSettingsModal(true); }}
        unreadCount={unreadCount}
        notifications={notifications}
        i18nLang={i18n.language}
        isMenuOpen={isMenuOpen}
        onToggleMenu={() => { setIsMenuOpen(!isMenuOpen); }}
      />

      <MobileMenu
        isOpen={isMenuOpen}
        onClose={() => { setIsMenuOpen(false); }}
        onLogout={() => { logout(); navigate('/'); }}
        onToggleLanguage={toggleLanguage}
        onOpenSettings={() => { setShowSettingsModal(true); }}
        i18nLang={i18n.language}
      />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20">
        <StatusCard
          profile={profile}
          isLoading={isLoading}
          progressData={progressData}
          tierLabel={t('lounge.tier_label')}
        />

        <section className="lg:w-2/3">
          <RewardPortfolio
            rewards={rewards}
            isLoading={isLoading}
            onRedeem={(reward) => {
              setSelectedVoucher(reward);
              setRedemptionStatus('idle');
            }}
          />

          <ActivityFeed
            activities={activities}
          />
        </section>
      </div>

      <div className="max-w-7xl mx-auto mt-20 md:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 border-t border-black/10 dark:border-white/10 pt-16 md:pt-24 pb-16 md:pb-24">
        <MissionsPanel
          missions={missions}
          missionProgress={missionProgress}
        />

        <BadgeShowcase
          badges={badges}
          userBadges={userBadges}
        />
      </div>

      <VoucherModal
        voucher={selectedVoucher}
        status={redemptionStatus}
        onClose={() => { setSelectedVoucher(null); }}
        onConfirmRedeem={() => { void handleRedeem(selectedVoucher!.id); }}
      />

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

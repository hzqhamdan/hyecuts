import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import type { LoyaltyProfile, Reward, ActivityLog, Badge, UserBadge, Mission, UserMissionProgress } from '../types/loyalty';
import { getTierProgress } from './useTierProgress';

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  time: string;
}

const mockNotifications: Notification[] = [
  { id: 1, title: 'Tier Upgraded', message: 'Welcome to Legend tier. Enjoy your new perks.', isRead: false, time: '2h ago' },
  { id: 2, title: 'Reward Redeemed', message: 'Complimentary Hair Cut applied successfully.', isRead: true, time: '1d ago' },
];

export function useLoungeData(userId: string) {
  const { i18n } = useTranslation();

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

  const notifications = mockNotifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ms' : 'en';
    void i18n.changeLanguage(newLang);
  };

  const fetchProfile = async () => {
    try {
      const profileData = await api.get<any>(`/loyalty/profile/${userId}`);
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
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await fetchProfile();

        const [rewardsData, activitiesData] = await Promise.all([
          api.get<Reward[]>('/rewards'),
          api.get<ActivityLog[]>(`/gamification/activity/${userId}`)
        ]);
        setRewards(rewardsData);
        setActivities(activitiesData);

        const [badgesData, userBadgesData] = await Promise.all([
          api.get<Badge[]>('/gamification/badges'),
          api.get<UserBadge[]>(`/gamification/badges/${userId}`)
        ]);
        setBadges(badgesData);
        setUserBadges(userBadgesData);

        const [mDaily, mWeekly, umpData] = await Promise.all([
          api.get<Mission[]>('/gamification/missions/type/DAILY'),
          api.get<Mission[]>('/gamification/missions/type/WEEKLY'),
          api.get<UserMissionProgress[]>(`/gamification/missions/${userId}`)
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
  }, [userId]);

  const handleRedeem = async (rewardId: number) => {
    setRedemptionStatus('loading');
    try {
      await api.post(`/rewards/redeem/${userId}/${rewardId.toString()}`);
      setRedemptionStatus('success');
      const profileData = await api.get<LoyaltyProfile>(`/loyalty/profile/${userId}`);
      setProfile(profileData);
    } catch {
      setRedemptionStatus('error');
    }
  };

  const progressData = profile
    ? getTierProgress(profile.pointsBalance, profile.currentTier)
    : { percentage: 0, nextTier: '...' as string | null };

  return {
    profile,
    rewards,
    activities,
    badges,
    userBadges,
    missions,
    missionProgress,
    isLoading,
    selectedVoucher,
    redemptionStatus,
    showSettingsModal,
    showNotifications,
    isMenuOpen,
    notifications,
    unreadCount,
    progressData,
    i18n,
    setSelectedVoucher,
    setRedemptionStatus,
    setShowSettingsModal,
    setShowNotifications,
    setIsMenuOpen,
    toggleLanguage,
    handleRedeem,
    refreshProfile: fetchProfile
  };
}

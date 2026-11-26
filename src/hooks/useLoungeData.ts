import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import type { LoyaltyProfile, Reward, ActivityLog, Badge, UserBadge, Mission, UserMissionProgress } from '../types/loyalty';
import { getTierProgress } from './useTierProgress';
import { firstNonEmpty } from '../utils/text';

interface Notification {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  time: string;
}

const mockNotifications: Notification[] = [
  { id: 1, title: 'Tier Upgraded', message: 'Welcome to Artisan tier. Enjoy your new perks.', isRead: false, time: '2h ago' },
  { id: 2, title: 'Reward Redeemed', message: 'Complimentary Hair Cut applied successfully.', isRead: true, time: '1d ago' },
];

// GET /loyalty/profile/{id} returns the backend User entity. Columns that allow NULL
// come back as null, and test fixtures leave them out, so they are optional here.
interface ProfileResponse {
  id: string;
  email: string;
  currentPoints: number;
  tier: string;
  username?: string | null;
  fullName?: string | null;
  dob?: string | null;
  phone?: string | null;
  hairType?: string | null;
  hairLength?: string | null;
  hairScalp?: string | null;
  avatar?: string | null;
}

function toLoyaltyProfile(data: ProfileResponse): LoyaltyProfile {
  return {
    userId: data.id,
    email: data.email,
    username: firstNonEmpty(data.username) ?? data.email,
    fullName: data.fullName ?? '',
    pointsBalance: data.currentPoints,
    currentTier: data.tier,
    dob: firstNonEmpty(data.dob) ?? '1990-01-01',
    phone: data.phone ?? '',
    hairType: firstNonEmpty(data.hairType) ?? 'straight',
    hairLength: firstNonEmpty(data.hairLength) ?? 'short',
    hairScalp: firstNonEmpty(data.hairScalp) ?? 'normal',
    avatar: firstNonEmpty(data.avatar) ?? null,
  };
}

export function useLoungeData(userId: string, token?: string | null) {
  const { i18n } = useTranslation();
  const authToken = token ?? undefined;

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

  const fetchProfile = useCallback(async () => {
    try {
      const profileData = await api.get<ProfileResponse>(`/loyalty/profile/${userId}`, { token: authToken });
      setProfile(toLoyaltyProfile(profileData));
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [userId, authToken]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await fetchProfile();

        const [rewardsData, activitiesData] = await Promise.all([
          api.get<Reward[]>('/rewards', { token: authToken }),
          api.get<ActivityLog[]>(`/gamification/activity/${userId}`, { token: authToken })
        ]);
        // /rewards also returns rewards an admin has switched off (the admin
        // inventory needs them); members can't redeem those, so don't list them.
        setRewards(rewardsData.filter((reward) => reward.isActive));
        setActivities(activitiesData);

        const [badgesData, userBadgesData] = await Promise.all([
          api.get<Badge[]>('/gamification/badges', { token: authToken }),
          api.get<UserBadge[]>(`/gamification/badges/${userId}`, { token: authToken })
        ]);
        setBadges(badgesData);
        setUserBadges(userBadgesData);

        // QUEST is the third mission type; leaving it out hid the seeded quests.
        const [mDaily, mWeekly, mQuest, umpData] = await Promise.all([
          api.get<Mission[]>('/gamification/missions/type/DAILY', { token: authToken }),
          api.get<Mission[]>('/gamification/missions/type/WEEKLY', { token: authToken }),
          api.get<Mission[]>('/gamification/missions/type/QUEST', { token: authToken }),
          api.get<UserMissionProgress[]>(`/gamification/missions/${userId}`, { token: authToken })
        ]);
        setMissions([...mDaily, ...mWeekly, ...mQuest]);
        setMissionProgress(umpData);

      } catch (error) {
        console.error("Error fetching loyalty data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [userId, authToken, fetchProfile]);

  const handleRedeem = async (rewardId: string) => {
    setRedemptionStatus('loading');
    try {
      await api.post(`/rewards/redeem/${userId}/${rewardId}`, { token: authToken });
      setRedemptionStatus('success');
      // The endpoint returns the raw User entity, which has to be mapped like any other fetch.
      const profileData = await api.get<ProfileResponse>(`/loyalty/profile/${userId}`, { token: authToken });
      setProfile(toLoyaltyProfile(profileData));
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

export interface User {
  id: string;
  email: string;
  fullName: string;
  currentPoints: number;
  lifetimePoints: number;
  pointsBalance?: number; // Added to match backend model name usage in some views
  currentTier?: string;   // Added to match usage in MemberLounge
  currentStreak?: number;
  lastBookingDate?: string;
  tier: {
    name: string;
    pointsRequired: number;
  } | null;
}

export interface Reward {
  id: number;
  title: string;
  description: string;
  type: string;
  pointsCost: number;
  minimumTierRequired: string;
  stockAvailable: number | null;
}

export interface ActivityLog {
  id: number;
  actionType: string;
  description: string;
  pointsEarned: number;
  timestamp: string;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  category: string;
}

export interface UserBadge {
  id: number;
  badgeId: number;
  earnedAt: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  type: string;
  rewardPoints: number;
  targetAction: string;
  requiredCount: number;
}

export interface UserMissionProgress {
  id: number;
  missionId: number;
  currentProgress: number;
  completed: boolean;
}

export interface Booking {
  id: string;
  user: {
    email: string;
    fullName?: string;
  };
  appointmentTime: string;
  service: {
    name: string;
  };
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalPriceMyr: number;
}

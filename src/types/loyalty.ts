export interface User {
  id: string;
  email: string;
  fullName: string;
  currentPoints: number;
  lifetimePoints: number;
  pointsBalance?: number; 
  currentTier?: string;   
  currentStreak?: number;
  lastBookingDate?: string;
  dob?: string;
  phone?: string;
  hairType?: string;
  hairLength?: string;
  hairScalp?: string;
  avatar?: string | null;
  tier: {
    name: string;
    pointsRequired: number;
  } | null;
}

export interface LoyaltyProfile {
  userId: string;
  email: string;
  fullName: string;
  pointsBalance: number;
  currentTier: string;
  dob: string;
  phone: string;
  hairType: string;
  hairLength: string;
  hairScalp: string;
  avatar: string | null;
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
  createdAt?: string;
}

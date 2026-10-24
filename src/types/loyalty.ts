export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  currentPoints: number;
  lifetimePoints: number;
  pointsBalance?: number; 
  currentStreak?: number;
  lastBookingDate?: string;
  dob?: string;
  phone?: string;
  hairType?: string;
  hairLength?: string;
  hairScalp?: string;
  avatar?: string | null;
  tier: string;
}

export interface LoyaltyProfile {
  userId: string;
  email: string;
  username: string;
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

// Mirrors the backend Reward entity's JSON. The field names used to be
// minimumTierRequired/stockAvailable, which the API never sends, so tier and
// stock were silently missing everywhere they were read or written.
export interface Reward {
  id: string;
  title: string;
  description: string | null;
  pointsCost: number;
  minTier: string | null;
  stockCount: number | null; // null = unlimited
  isActive: boolean;
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

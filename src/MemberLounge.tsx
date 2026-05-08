import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Sparkles, ChevronRight, Activity, Target } from 'lucide-react';
import { useAuth } from './context/AuthContext';

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
  stockAvailable: number;
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

const MemberLounge = ({ setView }: { setView: (view: string) => void }) => {
  const { user } = useAuth();
  // Use real user ID if authenticated, fallback to a valid UUID if not for demo purposes
  const USER_ID = user?.id || "00000000-0000-0000-0000-000000000000";
  
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

  const API_BASE = "http://localhost:8080/api";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch Profile
        const profileRes = await fetch(`${API_BASE}/loyalty/profile/${USER_ID}`);
        if (profileRes.ok) {
          const userData = await profileRes.json();
          setProfile({
            userId: userData.id,
            pointsBalance: userData.currentPoints || 0,
            currentTier: userData.tier ? userData.tier.name : 'Rookie'
          });
        }

        // Fetch Rewards
        const rewardsRes = await fetch(`${API_BASE}/rewards`);
        if (rewardsRes.ok) setRewards(await rewardsRes.json());

        // Fetch Activity History
        const activityRes = await fetch(`${API_BASE}/gamification/activity/${USER_ID}`);
        if (activityRes.ok) setActivities(await activityRes.json());

        // Fetch Gamification data
        const bRes = await fetch(`${API_BASE}/gamification/badges`);
        if (bRes.ok) setBadges(await bRes.json());
        
        const ubRes = await fetch(`${API_BASE}/gamification/badges/${USER_ID}`);
        if (ubRes.ok) setUserBadges(await ubRes.json());

        const mDaily = await fetch(`${API_BASE}/gamification/missions/type/DAILY`).then(r => r.ok ? r.json() : []);
        const mWeekly = await fetch(`${API_BASE}/gamification/missions/type/WEEKLY`).then(r => r.ok ? r.json() : []);
        setMissions([...mDaily, ...mWeekly]);

        const umpRes = await fetch(`${API_BASE}/gamification/missions/${USER_ID}`);
        if (umpRes.ok) setMissionProgress(await umpRes.json());

      } catch (error) {
        console.error("Error fetching loyalty data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRedeem = async (rewardId: number) => {
    setRedemptionStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/rewards/redeem/${USER_ID}/${rewardId}`, {
        method: 'POST'
      });
      if (res.ok) {
        setRedemptionStatus('success');
        // Refresh profile to show deducted points
        const profileRes = await fetch(`${API_BASE}/loyalty/profile/${USER_ID}`);
        if (profileRes.ok) setProfile(await profileRes.json());
      } else {
        setRedemptionStatus('error');
      }
    } catch (error) {
      setRedemptionStatus('error');
    }
  };

  const getTierProgress = (points: number, tier: string) => {
    let min = 0, max = 1000;
    let nextTier = 'Regular';
    
    if (tier === 'Icon') {
      return { percentage: 100, nextTier: 'Max Tier' };
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
      className="min-h-screen bg-white text-black px-12 py-16 font-sans overflow-x-hidden"
    >
      {/* Navigation Header */}
      <nav className="flex justify-between items-center max-w-7xl mx-auto mb-24">
        <button onClick={() => setView('facade')}
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-studio-slate hover:text-studio-black transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Return to Facade
        </button>
        <div className="font-display text-2xl tracking-tighter uppercase font-medium italic">
          The Member Lounge
        </div>
        <div className="flex items-center gap-8">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-black transition-colors font-medium"
          >
            Profile & Privacy
          </button>
          <button
            onClick={() => setView('login')}
            className="text-[10px] uppercase tracking-widest text-zinc-300 hover:text-black transition-colors font-medium"
          >
            Atelier Access
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20">

        {/* SECTION 1: STATUS CARD (The Centerpiece) */}
        <section className="lg:w-1/3 flex flex-col items-center">
          <div className="w-80 flex flex-col items-center bg-studio-white border border-black/10 px-8 py-16">
            <span className="text-[10px] uppercase tracking-studio text-studio-slate font-sans mb-4">Membership Tier</span>
            <h2 className="font-display text-[32px] text-studio-black">
              {isLoading ? '...' : profile?.currentTier || 'Rookie'}
            </h2>

            {/* The Hairline Progress Arc */}
            <div className="mt-12 relative w-48 h-24 overflow-hidden flex justify-center">
              <svg className="w-48 h-48 absolute top-0" viewBox="0 0 192 192">
                <path
                  d="M 24 96 A 72 72 0 0 1 168 96"
                  stroke="#E5E5E5" 
                  strokeWidth="1"
                  fill="transparent"
                />
                <motion.path
                  d="M 24 96 A 72 72 0 0 1 168 96"
                  stroke="#B8A070" 
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
              <p className="font-sans text-studio-slate text-xs leading-relaxed max-w-[200px]">
                The pinnacle of grooming. Your status grants you access to the most refined services in the city.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: REWARD PORTFOLIO */}
        <section className="lg:w-2/3">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">The Portfolio</h3>
              <p className="font-sans text-studio-slate text-sm tracking-wide">Curated rewards and invitations</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-medium uppercase tracking-widest border-b border-studio-black pb-1">
                {rewards.length} Available Assets
              </span>
            </div>
          </div>

          {/* Editorial Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {isLoading ? (
              <div className="col-span-2 text-center py-12 text-studio-slate text-[10px] uppercase tracking-widest">
                Retrieving Secure Assets...
              </div>
            ) : rewards.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-studio-slate text-[10px] uppercase tracking-widest">
                No Assets Available
              </div>
            ) : rewards.map((reward, idx) => (
              <motion.div
                key={reward.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2 }}
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedVoucher(reward);
                  setRedemptionStatus('idle');
                }}
              >
                <div className="relative overflow-hidden aspect-[1.6/1] bg-white border border-black/10 p-8 flex flex-col justify-between transition-all duration-500 group-hover:shadow-xl group-hover:border-black">

                  {/* Top Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-studio-black rounded-full" />
                      <span className="text-[9px] uppercase tracking-widest font-medium">
                        {reward.minimumTierRequired || 'Any'} Tier
                      </span>
                    </div>
                    <Sparkles className="w-4 h-4 opacity-20 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Middle Content Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none">
                    <div className="bg-studio-black text-white px-4 py-2 text-[10px] uppercase tracking-widest flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                      Reveal Invitation <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h4 className="font-display text-xl uppercase tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-300">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-studio-slate font-sans leading-relaxed max-w-xs line-clamp-2 mb-3">
                      {reward.description}
                    </p>
                    <div className="font-mono text-[10px] tracking-widest text-studio-slate uppercase">
                      {reward.pointsCost} PTS {reward.stockAvailable !== null && `? ${reward.stockAvailable} Left`}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Recent Activity Feed */}
          {activities.length > 0 && (
            <div className="mt-24">
              <h3 className="font-display text-2xl uppercase tracking-tighter mb-8 border-b border-black/10 pb-4">Recent Activity</h3>
              <div className="space-y-4">
                {activities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex justify-between items-center p-4 bg-neutral-50 border border-neutral-100">
                    <div className="flex items-center gap-4">
                      <Activity className="w-4 h-4 text-studio-slate" />
                      <div>
                        <p className="text-sm font-medium">{act.description}</p>
                        <p className="text-[10px] text-studio-slate uppercase tracking-widest mt-1">
                          {new Date(act.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`font-mono text-sm ${act.pointsEarned > 0 ? 'text-green-600' : 'text-studio-slate'}`}>
                      {act.pointsEarned > 0 ? '+' : ''}{act.pointsEarned} PTS
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* SECTION 3: MISSIONS & BADGES */}
      <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 lg:grid-cols-2 gap-20 border-t border-black/10 pt-24 pb-24">
        
        {/* Active Missions */}
        <section>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">Directives</h3>
              <p className="font-sans text-studio-slate text-sm tracking-wide">Active challenges</p>
            </div>
            <Target className="w-6 h-6 opacity-40" />
          </div>

          <div className="space-y-4">
            {missions.length === 0 ? (
              <div className="text-[10px] uppercase tracking-widest text-studio-slate">No active directives.</div>
            ) : (
              missions.slice(0, 3).map(mission => {
                const prog = missionProgress.find(p => p.missionId === mission.id) || { currentProgress: 0, completed: false };

                return (
                  <div key={mission.id} className="py-4 border-b border-black/5 flex justify-between items-center group">
                    <div className={`flex items-center gap-4 ${prog.completed ? 'opacity-30 line-through' : ''}`}>
                      <div className="w-1.5 h-1.5 bg-studio-gold rounded-full" />
                      <div>
                        <h4 className="font-sans text-sm uppercase tracking-widest font-medium text-studio-black">
                          {mission.title}
                        </h4>
                        {!prog.completed && (
                          <div className="text-[10px] text-studio-slate uppercase tracking-widest mt-1">
                            {prog.currentProgress} / {mission.requiredCount} {mission.targetAction}
                          </div>
                        )}
                      </div>
                    </div>
                    {!prog.completed && (
                      <span className="text-[10px] font-mono tracking-widest text-studio-slate">
                        +{mission.rewardPoints} PTS
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Badge Showcase */}
        <section>
          <div className="flex items-end justify-between mb-12">
            <div>
              <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">The Archive</h3>
              <p className="font-sans text-studio-slate text-sm tracking-wide">Honors collection</p>
            </div>
            <Award className="w-6 h-6 opacity-40" />
          </div>

          <div className="flex flex-col gap-4">
            {badges.length === 0 ? (
              <div className="text-[10px] uppercase tracking-widest text-studio-slate">No honors registered.</div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {badges.slice(0, 5).map(badge => {
                  const unlocked = userBadges.some(ub => ub.badgeId === badge.id);
                  return (
                    <div 
                      key={badge.id} 
                      className={`px-6 py-4 border transition-all ${
                        unlocked ? 'border-studio-black text-studio-black bg-studio-white' : 'border-neutral-200 text-neutral-400 opacity-40 bg-white'
                      }`}
                    >
                      <div className="font-display text-sm uppercase tracking-widest leading-none">{badge.name}</div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {badges.length > 5 && (
              <div className="mt-4">
                <a href="#" className="text-[10px] uppercase tracking-widest text-studio-slate hover:text-studio-black border-b border-transparent hover:border-studio-black transition-colors">
                  View Collection
                </a>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* SIGNATURE TRANSITION: Voucher Modal */}
      
        {selectedVoucher && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-studio-black/95 backdrop-blur-md p-6">
            <div className="bg-[#F9F9F7] w-full max-w-lg relative overflow-hidden shadow-2xl">
              {/* Luxury Invitation Styling */}
              <div className="p-12 flex flex-col items-center text-center bg-[url('https://www.transparenttextures.com/patterns/paper.png')] bg-repeat">
                <div className="w-full border-t border-b border-studio-black py-8 mb-12">
                  <span className="font-sans text-[10px] uppercase tracking-[0.4em] text-studio-slate block mb-4">Exclusive Invitation</span>
                  <h2 className="font-display text-4xl uppercase tracking-tighter mb-2">The Studio</h2>
                  <div className="h-px w-12 bg-studio-black mx-auto mt-6" />
                </div>

                <div className="relative group mb-12">
                  {/* Physical Card Feel */}
                  <div className="bg-neutral-50 border border-studio-black/20 p-10 flex flex-col items-center gap-8 w-72 shadow-sm">
                    <div className="bg-black p-6 rounded-none">
                      <Award className="w-20 h-20 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="font-display text-lg uppercase tracking-tight leading-tight">{selectedVoucher.title}</div>
                      <div className="font-mono text-[10px] text-studio-slate tracking-widest">
                        COST: {selectedVoucher.pointsCost} PTS
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                  {redemptionStatus === 'success' ? (
                    <div className="py-4 text-[10px] uppercase tracking-widest text-green-700 font-bold border border-green-200 bg-green-50">
                      Redemption Confirmed
                    </div>
                  ) : redemptionStatus === 'error' ? (
                    <div className="py-4 text-[10px] uppercase tracking-widest text-red-700 font-bold border border-red-200 bg-red-50">
                      Insufficient Points or Stock
                    </div>
                  ) : (
                    <button onClick={() => handleRedeem(selectedVoucher.id)}
                      disabled={redemptionStatus === 'loading'}
                      className="bg-studio-black text-white py-4 text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      {redemptionStatus === 'loading' ? 'Processing...' : 'Redeem Asset'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setSelectedVoucher(null)}
                    className="text-[10px] uppercase tracking-widest text-studio-slate hover:text-studio-black transition-colors mt-2"
                  >
                    Close Portfolio
                  </button>
                </div>
              </div>

              {/* Decorative Corner Elements */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-studio-black/10" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-studio-black/10" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-studio-black/10" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-studio-black/10" />
            </div>
          </div>
        )}

      {/* PDPA Privacy & Data Export Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-studio-black/95 backdrop-blur-md p-6">
          <div className="bg-studio-white w-full max-w-lg relative overflow-hidden shadow-2xl p-12">
            <h2 className="font-display text-2xl uppercase tracking-tighter mb-6 text-studio-black">Profile & Privacy</h2>
            <p className="font-sans text-xs text-studio-slate leading-relaxed mb-8">
              Manage your personal data under the Personal Data Protection Act (PDPA) 2010.
            </p>
            
            <div className="space-y-4 mb-10">
              <button 
                onClick={() => {
                  if(profile) {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
                    const dlAnchorElem = document.createElement('a');
                    dlAnchorElem.setAttribute("href", dataStr);
                    dlAnchorElem.setAttribute("download", "thestudio_my_data.json");
                    dlAnchorElem.click();
                  }
                }}
                className="w-full text-left p-4 border border-zinc-200 hover:border-black hover:bg-neutral-50 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-widest font-bold mb-1">Export Data (JSON)</div>
                <div className="text-xs text-studio-slate">Download a copy of your personal data.</div>
              </button>
              
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to permanently delete your account and all associated data? This action is irreversible.")) {
                    alert("Account deletion request submitted. Deletion will be completed within 30 days.");
                    setView('login');
                  }
                }}
                className="w-full text-left p-4 border border-red-200 hover:bg-red-50 transition-colors group"
              >
                <div className="text-[10px] uppercase tracking-widest font-bold text-red-600 mb-1">Delete Account</div>
                <div className="text-xs text-red-500/80 group-hover:text-red-500">Permanently erase your profile.</div>
              </button>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="w-full bg-studio-black text-white py-4 text-[10px] uppercase tracking-widest hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
    </motion.div>
  );
};

export default MemberLounge;

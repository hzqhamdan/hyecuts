import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import {
  LayoutDashboard,
  Ticket,
  Gem,
  History,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  SlidersHorizontal,
  CreditCard
} from 'lucide-react';

const API_BASE = "http://localhost:8080/api";

type View = 'overview' | 'validator' | 'inventory' | 'economy' | 'history';

interface AtelierDashboardProps {
  setView?: (view: string) => void;
}

export default function AtelierDashboard({ setView }: AtelierDashboardProps) {
  const { logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [voucherCode, setVoucherCode] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [pointRatio, setPointRatio] = useState(10);
  const [seasonalMultiplier, setSeasonalMultiplier] = useState(1.2);

  // Data states
  const [rewards, setRewards] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial data
    if (currentView === 'inventory') {
      fetch(`${API_BASE}/rewards`)
        .then(res => res.json())
        .then(data => setRewards(data))
        .catch(err => console.error("Failed to load rewards:", err));
    }
  }, [currentView]);

  const handleNav = (view: View) => {
    setCurrentView(view);
    if (setView) setView(view);
  };

  const validateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationState('idle');
    
    // Extract ID from e.g. HC-0005
    const idMatch = voucherCode.match(/HC-0*(\d+)/i);
    if (!idMatch) {
      setValidationState('denied');
      return;
    }
    
    const redemptionId = idMatch[1];

    try {
      const res = await fetch(`${API_BASE}/admin/redemptions/${redemptionId}/fulfill`, {
        method: 'POST'
      });
      
      if (res.ok) {
        setValidationState('granted');
      } else {
        setValidationState('denied');
      }
    } catch (err) {
      setValidationState('denied');
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* THE ATELIER SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-r border-zinc-100 flex flex-col h-auto md:h-screen sticky top-0 bg-white z-20">
        <div className="p-10 mb-8">
          <h1 className="font-serif text-3xl tracking-tighter font-light uppercase italic">
            Hyecuts <span className="font-sans text-[10px] not-italic tracking-[0.3em] block text-zinc-400 uppercase mt-1">Atelier Administration</span>
          </h1>
        </div>

        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible px-6 space-y-0 md:space-y-2">
          <NavItem
            active={currentView === 'overview'}
            onClick={() => handleNav('overview')}
            icon={<LayoutDashboard size={18} />}
            label="Overview"
          />
          <NavItem
            active={currentView === 'validator'}
            onClick={() => handleNav('validator')}
            icon={<Ticket size={18} />}
            label="The Validator"
          />
          <NavItem
            active={currentView === 'inventory'}
            onClick={() => handleNav('inventory')}
            icon={<Gem size={18} />}
            label="Rewards Inventory"
          />
          <NavItem
            active={currentView === 'economy'}
            onClick={() => handleNav('economy')}
            icon={<SlidersHorizontal size={18} />}
            label="Economy Center"
          />
          <NavItem
            active={currentView === 'history'}
            onClick={() => handleNav('history')}
            icon={<History size={18} />}
            label="Fulfillment Log"
          />
        </nav>

        <div className="p-8 border-t border-zinc-100 mt-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 p-4 rounded-none bg-zinc-50/50 border border-zinc-100">
              <div className="relative">
                <div className="w-1 h-1 bg-green-500 rounded-full absolute -top-1 -right-1 border border-white" />
                <ShieldCheck size={14} className="text-zinc-400" />
              </div>
              <div className="text-[10px] uppercase tracking-widest">
                <p className="font-bold text-black">Session Active</p>
                <p className="text-zinc-400">Secure Tunnel</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                if (setView) setView('facade');
              }}
              className="w-full py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all text-center"
            >
              Sign Out & Exit
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-6 md:px-12 py-12 md:py-16 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={springTransition}
            className="max-w-6xl mx-auto"
          >
            {currentView === 'overview' && <OverviewView />}
            {currentView === 'validator' && (
              <ValidatorFocusMode
                code={voucherCode}
                setCode={setVoucherCode}
                state={validationState}
                onValidate={validateVoucher}
              />
            )}
            {currentView === 'inventory' && <RewardsInventory rewards={rewards} setRewards={setRewards} />}
            {currentView === 'economy' && (
              <EconomyControlCenter
                ratio={pointRatio} setRatio={setPointRatio}
                multiplier={seasonalMultiplier} setMultiplier={setSeasonalMultiplier}
              />
            )}
            {currentView === 'history' && <FulfillmentHistory />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 transition-all duration-300 group whitespace-nowrap ${
        active
        ? 'bg-black text-white'
        : 'text-zinc-400 hover:text-black hover:bg-zinc-50'
      }`}
    >
      <div className="flex items-center gap-4">
        <span className={`transition-colors ${active ? 'text-white' : 'group-hover:text-black'}`}>{icon}</span>
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
      </div>
      {active && <motion.div layoutId="nav-indicator" className="w-1 h-1 bg-white rounded-full" />}
    </button>
  );
}

function OverviewView() {
  const [stats, setStats] = useState({ redemptions: 0, activeRewards: 0 });

  useEffect(() => {
    fetch(`${API_BASE}/rewards`)
      .then(r => r.json())
      .then(d => setStats(s => ({...s, activeRewards: d.length})));
  }, []);

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light tracking-tight">Atelier Overview</h2>
        <p className="text-zinc-400 font-sans max-w-md leading-relaxed">Welcome back, Curator. The ecosystem is balanced and the assets are primed.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
        {[
          { label: 'Total Redemptions', value: stats.redemptions.toString(), trend: '+12%' },
          { label: 'Active Rewards', value: stats.activeRewards.toString(), trend: 'Stable' },
          { label: 'Economy Velocity', value: '8.4x', trend: '+2.1%' },
        ].map((stat, i) => (
          <div key={i} className="p-10 bg-white hover:bg-zinc-50 transition-colors">
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-6">{stat.label}</p>
            <div className="flex justify-between items-end">
              <h3 className="font-serif text-4xl font-light">{stat.value}</h3>
              <span className="text-xs font-medium px-2 py-1 bg-black text-white rounded-none">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ValidatorProps {
  code: string;
  setCode: (code: string) => void;
  state: 'idle' | 'granted' | 'denied';
  onValidate: (e: React.FormEvent) => void;
}

function ValidatorFocusMode({ code, setCode, state, onValidate }: ValidatorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-3xl mx-auto">
      <div className="w-full text-center mb-16">
        <h2 className="font-serif text-5xl mb-4 font-light">The Validator</h2>
        <p className="text-zinc-400 italic text-sm uppercase tracking-widest">Sequence Authorization</p>
      </div>

      <motion.div
        className={`w-full p-16 border transition-all duration-700 ${
          state === 'granted' ? 'border-green-500 bg-green-50/10' :
          state === 'denied' ? 'border-red-500 bg-red-50/10' :
          'border-black bg-white'
        }`}
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
      >
        <form onSubmit={onValidate} className="flex flex-col items-center gap-12">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="HC-XXXX-XXXX"
            className="w-full text-center text-5xl font-serif uppercase tracking-[0.3em] bg-transparent border-b border-black focus:outline-none focus:border-black transition-all placeholder:text-zinc-200"
            autoFocus
          />
          <button
            type="submit"
            className="px-16 py-4 bg-black text-white uppercase tracking-[0.2em] text-[10px] font-bold hover:bg-zinc-800 transition-all"
          >
            Execute Validation
          </button>
        </form>

        <div className="mt-16 flex justify-center">
          <AnimatePresence mode="wait">
            {state === 'granted' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 text-green-600 font-bold uppercase tracking-widest text-[11px]"
              >
                <CheckCircle2 size={16} /> Access Granted
              </motion.div>
            )}
            {state === 'denied' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 text-red-600 font-bold uppercase tracking-widest text-[11px]"
              >
                <XCircle size={16} /> Access Denied
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

function RewardsInventory({ rewards, setRewards }: { rewards: any[], setRewards: any }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newReward, setNewReward] = useState({ title: '', pointsCost: 1000, type: 'SERVICE_DISCOUNT', minimumTierRequired: 'Rookie', stockAvailable: 10 });

  const handleAddAsset = async () => {
    try {
      const res = await fetch(`${API_BASE}/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReward)
      });
      if (res.ok) {
        const saved = await res.json();
        setRewards([...rewards, saved]);
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">Rewards Collection</h2>
          <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Asset Registry</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-8 py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all">
          {isAdding ? 'Cancel' : 'Add Asset'}
        </button>
      </header>

      {isAdding && (
        <div className="p-8 border border-zinc-200 bg-zinc-50 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest">Register New Asset</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Title" value={newReward.title} onChange={e => setNewReward({...newReward, title: e.target.value})} className="p-3 border border-zinc-200 text-sm" />
            <input type="number" placeholder="Points Cost" value={newReward.pointsCost} onChange={e => setNewReward({...newReward, pointsCost: parseInt(e.target.value)})} className="p-3 border border-zinc-200 text-sm" />
            <select value={newReward.minimumTierRequired} onChange={e => setNewReward({...newReward, minimumTierRequired: e.target.value})} className="p-3 border border-zinc-200 text-sm">
              <option value="Rookie">Rookie</option>
              <option value="Regular">Regular</option>
              <option value="Legend">Legend</option>
              <option value="Master">Master</option>
              <option value="Icon">Icon</option>
            </select>
            <input type="number" placeholder="Stock" value={newReward.stockAvailable} onChange={e => setNewReward({...newReward, stockAvailable: parseInt(e.target.value)})} className="p-3 border border-zinc-200 text-sm" />
          </div>
          <button onClick={handleAddAsset} className="bg-black text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold">Save Asset</button>
        </div>
      )}

      <div className="overflow-x-auto border border-zinc-200">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              <th className="p-6">Asset ID</th>
              <th className="p-6">Reward Name</th>
              <th className="p-6">Valuation</th>
              <th className="p-6">Stock</th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rewards.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                <td className="p-6 font-mono text-xs text-zinc-400">{item.id}</td>
                <td className="p-6 font-medium text-sm">{item.title}</td>
                <td className="p-6 text-sm text-zinc-400">{item.pointsCost} pts</td>
                <td className="p-6 text-sm text-zinc-400">{item.stockAvailable ?? 'Unlimited'}</td>
                <td className="p-6">
                  <span className="text-[9px] uppercase tracking-tighter px-2 py-1 border border-zinc-200 text-zinc-500 font-bold">
                    {item.minimumTierRequired} Tier
                  </span>
                </td>
              </tr>
            ))}
            {rewards.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-sm text-zinc-400">No assets registered.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface EconomyProps {
  ratio: number;
  setRatio: (ratio: number) => void;
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
}

function EconomyControlCenter({ ratio, setRatio, multiplier, setMultiplier }: EconomyProps) {
  const [targetUser, setTargetUser] = useState('user-123');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustStatus, setAdjustStatus] = useState('');

  const handleAdjust = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/points/adjust/${targetUser}?points=${adjustAmount}`, {
        method: 'POST'
      });
      if (res.ok) {
        setAdjustStatus('Success');
        setTimeout(() => setAdjustStatus(''), 2000);
      } else {
        setAdjustStatus('Error');
      }
    } catch(e) {
      setAdjustStatus('Error');
    }
  };

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">Economy Center</h2>
        <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Engine Calibration & Adjustments</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
        <div className="p-12 bg-white space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Point-per-Visit Ratio</label>
            <span className="font-serif text-3xl">{ratio} pts</span>
          </div>
          <input
            type="range"
            min="1" max="50"
            value={ratio}
            onChange={(e) => setRatio(parseInt(e.target.value))}
            className="w-full h-px bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            Controls the baseline point accumulation for every completed visit.
          </p>
        </div>

        <div className="p-12 bg-white space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Seasonal Multiplier</label>
            <span className="font-serif text-3xl">{multiplier}x</span>
          </div>
          <input
            type="range"
            min="1" max="3" step="0.1"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full h-px bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            Global multiplier applied to all point earnings.
          </p>
        </div>
      </div>

      <div className="bg-white p-12 border border-zinc-200 space-y-12">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Manual Point Adjustment</label>
            <span className="font-serif text-3xl">{adjustAmount > 0 ? '+' : ''}{adjustAmount}</span>
          </div>
          <div className="flex flex-col gap-4 max-w-md">
            <input 
              type="text" 
              value={targetUser} 
              onChange={e => setTargetUser(e.target.value)} 
              placeholder="User ID" 
              className="p-3 border border-zinc-200 text-sm" 
            />
            <input 
              type="number" 
              value={adjustAmount} 
              onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)} 
              placeholder="Amount (+ or -)" 
              className="p-3 border border-zinc-200 text-sm" 
            />
            <button 
              onClick={handleAdjust} 
              className="w-full py-3 bg-black text-white text-[10px] uppercase tracking-widest font-bold"
            >
              Apply Adjustment {adjustStatus && `(${adjustStatus})`}
            </button>
          </div>
      </div>
    </div>
  );
}

function FulfillmentHistory() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/admin/activity`)
      .then(r => r.json())
      .then(d => setLogs(d))
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-5xl mb-4 font-light">Fulfillment History</h2>
        <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Audit Log</p>
      </header>

      <div className="space-y-px bg-zinc-200 border border-zinc-200">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-6 bg-white flex items-center justify-between group hover:bg-zinc-50 transition-all cursor-default"
          >
            <div className="flex items-center gap-8">
              <div className="p-2 bg-zinc-50 text-zinc-400 border border-zinc-100">
                <CreditCard size={14} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{log.description}</p>
                <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">{log.actionType}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <span className="text-[10px] text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
              <span className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 border ${
                log.pointsEarned < 0 ? 'border-green-200 text-green-600 bg-green-50/30' : 'border-zinc-200 text-zinc-400 bg-zinc-50'
              }`}>
                {log.pointsEarned < 0 ? 'Redeemed' : 'Earned'}
              </span>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-6 bg-white text-center text-sm text-zinc-400">No activity logs found.</div>
        )}
      </div>
    </div>
  );
}

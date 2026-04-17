import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Ticket,
  Gem,
  Settings,
  History,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronRight,
  SlidersHorizontal,
  CreditCard
} from 'lucide-react';

type View = 'overview' | 'validator' | 'inventory' | 'economy' | 'history';

interface AtelierDashboardProps {
  setView?: (view: any) => void;
}

export default function AtelierDashboard({ setView }: AtelierDashboardProps) {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [voucherCode, setVoucherCode] = useState('');
  const [validationState, setValidationState] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [pointRatio, setPointRatio] = useState(10);
  const [seasonalMultiplier, setSeasonalMultiplier] = useState(1.2);

  const handleNav = (view: View) => {
    setCurrentView(view);
    if (setView) setView(view);
  };

  const validateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationState('idle');

    setTimeout(() => {
      const isGranted = voucherCode.toUpperCase().startsWith('HC-');
      setValidationState(isGranted ? 'granted' : 'denied');
    }, 800);
  };

  const springTransition = {
    type: "spring",
    stiffness: 260,
    damping: 20
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* THE ATELIER SIDEBAR */}
      <aside className="w-full md:w-72 border-b md:border-r border-zinc-200 flex flex-col h-auto md:h-screen sticky top-0 bg-white z-20">
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
            <div className="flex items-center gap-4 p-4 rounded-none bg-zinc-50 border border-zinc-200">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full absolute -top-1 -right-1 border border-white" />
                <ShieldCheck size={16} className="text-zinc-400" />
              </div>
              <div className="text-[11px] uppercase tracking-widest">
                <p className="font-bold text-black">Session Active</p>
                <p className="text-zinc-400">Secure Tunnel</p>
              </div>
            </div>
            <button
              onClick={() => setView('lounge')}
              className="w-full py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all text-center"
            >
              Exit to Lounge
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
            {currentView === 'inventory' && <RewardsInventory />}
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
  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light tracking-tight">Atelier Overview</h2>
        <p className="text-zinc-400 font-sans max-w-md leading-relaxed">Welcome back, Curator. The ecosystem is balanced and the assets are primed.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-200 border border-zinc-200">
        {[
          { label: 'Total Redemptions', value: '1,284', trend: '+12%' },
          { label: 'Active Rewards', value: '42', trend: 'Stable' },
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

function ValidatorFocusMode({ code, setCode, state, onValidate }: any) {
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

function RewardsInventory() {
  const items = [
    { id: 'R01', name: 'Signature Cut complimentary', value: '500 pts', stock: 'Unlimited', status: 'Active' },
    { id: 'R02', name: 'Luxury Shave Experience', value: '800 pts', stock: '12 Left', status: 'Active' },
    { id: 'R03', name: 'Atelier Grooming Kit', value: '1200 pts', stock: '5 Left', status: 'Limited' },
    { id: 'R04', name: 'Seasonal Style Consultation', value: '1500 pts', stock: '2 Left', status: 'Rare' },
  ];

  return (
    <div className="space-y-16">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">Rewards Collection</h2>
          <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Asset Registry</p>
        </div>
        <button className="px-8 py-3 border border-black text-[10px] uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-all">
          Add Asset
        </button>
      </header>

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
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50 transition-colors group cursor-pointer">
                <td className="p-6 font-mono text-xs text-zinc-400">{item.id}</td>
                <td className="p-6 font-medium text-sm">{item.name}</td>
                <td className="p-6 text-sm text-zinc-400">{item.value}</td>
                <td className="p-6 text-sm text-zinc-400">{item.stock}</td>
                <td className="p-6">
                  <span className="text-[9px] uppercase tracking-tighter px-2 py-1 border border-zinc-200 text-zinc-500 font-bold">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EconomyControlCenter({ ratio, setRatio, multiplier, setMultiplier }: any) {
  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-4xl md:text-5xl mb-4 font-light">Economy Center</h2>
        <p className="text-zinc-400 font-sans uppercase tracking-widest text-[11px]">Engine Calibration</p>
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
            className="w-full h-0.5 bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
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
            className="w-full h-0.5 bg-zinc-200 rounded-none appearance-none cursor-pointer accent-black"
          />
          <p className="text-xs text-zinc-400 leading-relaxed italic">
            Global multiplier applied to all point earnings.
          </p>
        </div>
      </div>
    </div>
  );
}

function FulfillmentHistory() {
  const logs = [
    { id: 'TX-9901', user: 'Julian Thorne', reward: 'Signature Cut', date: '2026-04-15 14:20', status: 'Fulfilled' },
    { id: 'TX-9882', user: 'Elena Voss', reward: 'Luxury Shave', date: '2026-04-15 11:05', status: 'Fulfilled' },
    { id: 'TX-9870', user: 'Marcus Aurelius', reward: 'Atelier Kit', date: '2026-04-14 18:45', status: 'Pending' },
    { id: 'TX-9865', user: 'Sasha Grey', reward: 'Signature Cut', date: '2026-04-14 09:12', status: 'Fulfilled' },
  ];

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
                <p className="text-sm font-medium">{log.user}</p>
                <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight">{log.id} • {log.reward}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <span className="text-[10px] text-zinc-400 font-mono">{log.date}</span>
              <span className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 border ${
                log.status === 'Fulfilled' ? 'border-green-200 text-green-600 bg-green-50/30' : 'border-zinc-200 text-zinc-400 bg-zinc-50'
              }`}>
                {log.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

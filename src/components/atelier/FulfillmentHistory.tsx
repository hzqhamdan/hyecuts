import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';

import type { ActivityLog } from '../../types/loyalty';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8081') + '/api';

export function FulfillmentHistory() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

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

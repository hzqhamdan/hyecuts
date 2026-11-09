import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ActivityLog } from '../../types/loyalty';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function FulfillmentHistory() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    void api.get<ActivityLog[]>('/admin/activity', { token: token ?? undefined })
      .then(d => { setLogs(d); })
      .catch((err: unknown) => { console.error(err); });
  }, [token]);

  return (
    <div className="space-y-16">
      <header>
        <h2 className="font-serif text-5xl mb-4 font-light">{t('atelier.history.title', { defaultValue: 'Fulfillment History' })}</h2>
        <p className="text-ink-faint font-sans uppercase tracking-widest text-[11px]">{t('atelier.history.subtitle', { defaultValue: 'Audit Log' })}</p>
      </header>

      <div className="space-y-px bg-hairline-strong border border-hairline-strong">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-6 bg-surface-card flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-default"
          >
            <div className="flex items-center gap-8">
              <div className="p-2 bg-zinc-50 text-ink-faint border border-zinc-100">
                <CreditCard size={14} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-medium">{log.description}</p>
                <p className="text-[10px] text-ink-faint font-mono uppercase tracking-tight">{log.actionType}</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <span className="text-[10px] text-ink-faint font-mono">{new Date(log.timestamp).toLocaleString()}</span>
              <span className={`text-[9px] uppercase tracking-widest font-bold px-3 py-1 border ${
                log.pointsEarned < 0 ? 'border-green-200 dark:border-green-900 text-success bg-green-50/30 dark:bg-green-900/20' : 'border-hairline-strong text-ink-faint bg-zinc-50'
              }`}>
                {log.pointsEarned < 0 ? t('atelier.history.redeemed', { defaultValue: 'Redeemed' }) : t('atelier.history.earned', { defaultValue: 'Earned' })}
              </span>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-20 bg-surface-card text-center text-ink-faint uppercase tracking-widest text-xs">{t('atelier.history.no_logs', { defaultValue: 'No activity logs found.' })}</div>
        )}
      </div>
    </div>
  );
}


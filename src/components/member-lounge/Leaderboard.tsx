import { Trophy } from 'lucide-react';
import type { User } from '../../types/loyalty';

interface LeaderboardProps {
  users: User[];
}

export const Leaderboard = ({ users }: LeaderboardProps) => {
  return (
    <section className="mt-24">
      <div className="flex items-end justify-between mb-12 border-b border-black/10 pb-4">
        <div>
          <h3 className="font-display text-4xl uppercase tracking-tighter mb-2">The Vanguard</h3>
          <p className="font-sans text-neutral-500 text-sm tracking-wide">Elite member rankings</p>
        </div>
        <Trophy className="w-6 h-6 opacity-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200">
        {users.map((user, idx) => (
          <div key={user.id} className="bg-white p-8 flex items-center justify-between group hover:bg-neutral-50 transition-colors">
            <div className="flex items-center gap-6">
              <span className="font-serif text-3xl italic text-neutral-300 group-hover:text-black transition-colors">
                {idx + 1}
              </span>
              <div>
                <h4 className="font-display text-lg uppercase tracking-tight leading-tight">
                  {user.fullName || user.email.split('@')[0]}
                </h4>
                <div className="text-[9px] uppercase tracking-widest font-mono text-neutral-400 mt-1">
                  {user.tier?.name || 'Rookie'} TIER
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs font-bold">{user.currentPoints}</div>
              <div className="text-[8px] uppercase tracking-widest text-neutral-400">Points</div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="col-span-3 py-12 bg-white text-center text-xs uppercase tracking-widest text-neutral-400">
            Rankings being calculated...
          </div>
        )}
      </div>
    </section>
  );
};

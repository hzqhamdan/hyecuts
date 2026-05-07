const fs = require('fs');

const path = 'C:\\Users\\nurha\\hyecuts\\src\\MemberLounge.tsx';
let content = fs.readFileSync(path, 'utf8');

const section3Start = content.indexOf('{/* SECTION 3: MISSIONS & BADGES */}');
const section4Start = content.indexOf('{/* SIGNATURE TRANSITION: Voucher Modal */}');

const newSection3 = `{/* SECTION 3: MISSIONS & BADGES */}
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
                    <div className={\`flex items-center gap-4 \${prog.completed ? 'opacity-30 line-through' : ''}\`}>
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
                      className={\`px-6 py-4 border transition-all \${
                        unlocked ? 'border-studio-black text-studio-black bg-studio-white' : 'border-neutral-200 text-neutral-400 opacity-40 bg-white'
                      }\`}
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

      `;

content = content.substring(0, section3Start) + newSection3 + content.substring(section4Start);

fs.writeFileSync(path, content);

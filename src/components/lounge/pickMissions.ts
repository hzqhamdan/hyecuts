import type { Mission, UserMissionProgress } from '../../types/loyalty';

const MAX_SHOWN = 3;

/** Interleaves missions by type: the first of each type, then the second of each, and so on. */
function alternateTypes(missions: Mission[]): Mission[] {
  const byType = new Map<string, Mission[]>();
  for (const mission of missions) {
    byType.set(mission.type, [...(byType.get(mission.type) ?? []), mission]);
  }
  const queues = [...byType.values()];
  const longest = Math.max(0, ...queues.map(q => q.length));
  return Array.from({ length: longest }, (_, i) => queues.flatMap(q => q[i] ? [q[i]] : [])).flat();
}

/**
 * The panel has room for three missions. Taking the first three meant quests,
 * which come after the daily and weekly ones, never showed once there were
 * three of those, and finished missions crowded out open ones. Open missions
 * go first, and the types take turns so each one gets a slot.
 */
export function pickMissions(missions: Mission[], missionProgress: UserMissionProgress[]): Mission[] {
  const done = new Set(missionProgress.filter(p => p.completed).map(p => p.missionId));
  return [
    ...alternateTypes(missions.filter(m => !done.has(m.id))),
    ...alternateTypes(missions.filter(m => done.has(m.id))),
  ].slice(0, MAX_SHOWN);
}

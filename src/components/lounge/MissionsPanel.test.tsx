import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Mission, UserMissionProgress } from '../../types/loyalty';
import MissionsPanel from './MissionsPanel';
import { pickMissions } from './pickMissions';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function mission(id: number, type: string): Mission {
  return { id, title: `${type} ${String(id)}`, description: '', type, rewardPoints: 10, targetAction: 'BOOK', requiredCount: 1 };
}

function finished(missionId: number): UserMissionProgress {
  return { id: missionId, missionId, currentProgress: 1, completed: true };
}

// The order the lounge loads them in: daily, then weekly, then quest.
const missions = [
  mission(1, 'DAILY'), mission(2, 'DAILY'),
  mission(3, 'WEEKLY'), mission(4, 'WEEKLY'),
  mission(5, 'QUEST'),
];

describe('pickMissions', () => {
  it('gives each type a slot, so a quest shows despite three daily and weekly missions', () => {
    expect(pickMissions(missions, []).map(m => m.id)).toEqual([1, 3, 5]);
  });

  it('puts open missions ahead of finished ones', () => {
    expect(pickMissions(missions, [finished(1), finished(5)]).map(m => m.id)).toEqual([2, 3, 4]);
  });

  it('still fills the panel with finished missions when too few are open', () => {
    expect(pickMissions(missions.slice(0, 2), [finished(1)]).map(m => m.id)).toEqual([2, 1]);
  });

  it('returns nothing for no missions', () => {
    expect(pickMissions([], [])).toEqual([]);
  });
});

describe('MissionsPanel', () => {
  it('renders the picked missions', () => {
    render(<MissionsPanel missions={missions} missionProgress={[]} />);

    expect(screen.getByText('QUEST 5')).toBeInTheDocument();
    expect(screen.queryByText('DAILY 2')).not.toBeInTheDocument();
  });
});

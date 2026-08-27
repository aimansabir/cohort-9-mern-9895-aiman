import type { ReactElement } from 'react';

import afternoonScene from '../assets/scene-afternoon.webp';
import eveningScene from '../assets/scene-evening.webp';
import morningScene from '../assets/scene-morning.webp';
import nightScene from '../assets/scene-night.webp';
import type { TimeOfDay } from '../utils/noteText';

const scenes: Record<TimeOfDay, string> = {
  morning: morningScene,
  afternoon: afternoonScene,
  evening: eveningScene,
  night: nightScene,
};

export default function HeaderScene({ time }: { time: TimeOfDay }): ReactElement {
  return <img className="header-scene" src={scenes[time]} alt="" aria-hidden="true" />;
}

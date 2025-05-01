import { readable } from 'svelte/store';

let activated = false;
let hasSubscribers = false;
let ticking: boolean = false;
let ensureTicking: (() => void) | null = null;

function second(ms?: number) {
  return Math.floor((ms ?? Date.now()) / 1000);
}

export const secondsSinceEpoch = readable<number>(second(), (set) => {

  hasSubscribers = true;

  ensureTicking = () => {
    if (!ticking) {
      ticking = true;
      scheduleTick();
    }
  };

  const tick = () => {
    if (hasSubscribers) {
      set(second());
      scheduleTick();
    } else {
      ticking = false;
    }
  };

  if (activated) {
    ensureTicking();
  }

  return () => {
    hasSubscribers = false;
  };

  function scheduleTick() {
    const now = Date.now();
    const upcomingSecondBoundary = (second(now) + 1) * 1000;
    setTimeout(tick, Math.max(upcomingSecondBoundary - now,0));
  }

});

/**
 * Activate once the application is ready for it to start firing every second,
 * ie do so in the onMount of routes/+layout.svelte
 */
export function activateClockStore() {
  activated = true;
  if (hasSubscribers && ensureTicking) {
    ensureTicking();
  }
}

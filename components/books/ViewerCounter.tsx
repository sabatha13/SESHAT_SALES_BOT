'use client';

import { useEffect, useState } from 'react';

interface ViewerCounterProps {
  bookId: string;
}

export default function ViewerCounter({ bookId: _bookId }: ViewerCounterProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Initial random count between 4 and 23
    const initial = Math.floor(Math.random() * (23 - 4 + 1)) + 4;
    setCount(initial);

    // After 3 s, nudge ±1 to feel live
    const liveTimer = setTimeout(() => {
      setCount(prev => {
        if (prev === null) return prev;
        const delta = Math.random() < 0.5 ? 1 : -1;
        return Math.min(28, Math.max(3, prev + delta));
      });
    }, 3000);

    // Every 30–45 s, randomly increment or decrement by 1
    let intervalId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * (45000 - 30000 + 1)) + 30000;
      intervalId = setTimeout(() => {
        setCount(prev => {
          if (prev === null) return prev;
          const delta = Math.random() < 0.5 ? 1 : -1;
          return Math.min(28, Math.max(3, prev + delta));
        });
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      clearTimeout(liveTimer);
      clearTimeout(intervalId);
    };
  }, []);

  if (count === null) return null;

  return (
    <div className="flex items-center justify-center">
      <span className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full px-3 py-1">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block mr-2 flex-shrink-0" />
        {count} personnes regardent ce livre en ce moment
      </span>
    </div>
  );
}

import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number;
  onComplete?: () => void;
}

const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Timer = ({ duration, onComplete }: TimerProps) => {
  const [remaining, setRemaining] = useState(duration);

  useEffect(() => {
    setRemaining(duration);

    const interval = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          onComplete?.();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [duration, onComplete]);

  const progress = duration > 0 ? remaining / duration : 0;
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);
  const isUrgent = remaining <= 3;

  return (
    <div
      aria-label={`Aikaa jäljellä ${formatTime(remaining)}`}
      className={`relative grid size-28 place-items-center rounded-full bg-emerald-950 shadow-lg shadow-emerald-950/20 ${isUrgent ? 'text-rose-300' : 'text-amber-200'}`}
      role="timer"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
        viewBox="0 0 100 100"
      >
        <circle
          className="fill-none stroke-emerald-800"
          cx="50"
          cy="50"
          r={RING_RADIUS}
          strokeWidth="6"
        />
        <circle
          className="fill-none stroke-current transition-[stroke-dashoffset] duration-1000 ease-linear"
          cx="50"
          cy="50"
          r={RING_RADIUS}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={strokeOffset}
          strokeLinecap="round"
          strokeWidth="6"
        />
      </svg>
      <span className="font-mono text-2xl font-bold tabular-nums">
        {formatTime(remaining)}
      </span>
    </div>
  );
};

export default Timer;

import type { CSSProperties } from 'react';

/** A shared start and finish line makes scores directly comparable across teams. */
export default function ScoreTrack({ score, max, loaded }: { score: number; max: number; loaded: boolean }) {
  const progress = loaded && max > 0 ? Math.min(1, Math.max(0, score) / max) : 0;
  return <div className={`score-track ${progress > 0 ? 'has-score' : ''}`} aria-hidden="true"
    style={{ '--race-progress': progress } as CSSProperties}>
    <span className="track-road"><span className="track-lane"/></span>
    <span className="track-start"/>
    <span className="track-finish"/>
    <span className="track-car">
      <svg viewBox="0 0 50 22">
        {/* Drawn nose-left (long hood at x≈2–21), mirrored so it drives towards the finish. */}
        <g transform="matrix(-1 0 0 1 50 0)">
        <path className="car-body" d="M2 16v-3.5C2 10.6 3.4 9.6 6 9.2l9-1.4 6.2-4.5C22.6 2.4 24.4 2 26.6 2h5.6c2.6 0 4.4.9 5.9 2.8l2.8 3.6 4.6 1c2.3.5 3.5 1.8 3.5 3.8V16Z"/>
        <path className="car-shade" d="M2 14.2h46.5V16H2Z"/>
        <path className="car-glass" d="m22.5 8.2 3.4-3.6c.6-.6 1.3-.9 2.2-.9h3.6c1.4 0 2.4.5 3.2 1.6l2 2.9Z"/>
        <path className="car-stripe" d="M7 11.2h14l-1.2 1.6H7Z"/>
        <circle className="car-tyre" cx="12" cy="16" r="4.6"/><circle className="car-hub" cx="12" cy="16" r="1.8"/>
        <circle className="car-tyre" cx="38.5" cy="16" r="4.6"/><circle className="car-hub" cx="38.5" cy="16" r="1.8"/>
        <path className="car-headlight" d="M2.2 10.6h3.2l-.4 2H2.2Z"/>
        <path className="car-taillight" d="M46.4 10.4h2.1v2.2h-2.1Z"/>
        </g>
      </svg>
    </span>
  </div>;
}

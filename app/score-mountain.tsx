import type { CSSProperties } from 'react';

/** A shared height scale makes scores directly comparable across teams. */
export default function ScoreMountain({ score, max, loaded }: { score: number; max: number; loaded: boolean }) {
  const progress = loaded && max > 0 ? Math.min(1, Math.max(0, score) / max) : 0;
  return <div className={`score-mountain ${progress > 0 ? 'has-score' : ''}`} aria-hidden="true"
    style={{ '--mountain-scale': progress, '--summit-rise': `${progress * 56}px` } as CSSProperties}>
    <svg className="mountain-guide" viewBox="0 0 180 80" preserveAspectRatio="none">
      <path d="M8 74 90 18 172 74"/>
      <path d="M8 74H172" className="mountain-ground"/>
    </svg>
    <svg className="mountain-shape" viewBox="0 0 180 56" preserveAspectRatio="none">
      <path className="mountain-face" d="M8 56 90 0 172 56Z"/>
      <path className="mountain-shadow" d="m90 0 82 56H104L83 24Z"/>
      <path className="mountain-snow" d="m90 0 25 17-14-3-8 7-9-8-17 3Z"/>
    </svg>
    <span className="mountain-flag"><svg width="17" height="19" viewBox="0 0 17 19"><path d="M2 18V1"/><path d="M3 2h12l-3 4 3 4H3Z"/></svg></span>
    <span className="mountain-base"/>
  </div>;
}

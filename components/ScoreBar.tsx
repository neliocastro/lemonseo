export function ScoreBar({ label, weightPct, score }: { label: string; weightPct?: number; score: number }) {
  return (
    <div className="ls-scorebar">
      <div className="ls-scorebar-head">
        <span>
          {label} {weightPct != null && <span className="ls-scorebar-weight">({weightPct}%)</span>}
        </span>
        <span>{score.toFixed(1)}/10</span>
      </div>
      <div className="ls-progress-track">
        <div className="ls-progress-fill" style={{ width: `${Math.max(0, Math.min(100, score * 10))}%` }} />
      </div>
    </div>
  );
}

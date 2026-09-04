export function ScoreRing({ score, size = 110 }: { score: number; size?: number }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const isLow = score < 4;

  return (
    <div
      className={`ls-score-ring ${isLow ? "low" : ""}`}
      style={{ width: size, height: size, "--ring-size": `${size}px` } as React.CSSProperties}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--lt-line-soft)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isLow ? "var(--lt-red)" : "var(--lt-lime)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dasharray 1.1s cubic-bezier(.4,0,.2,1) .1s" }}
        />
      </svg>
      <div className="ls-score-num">
        <span className="n">{score.toFixed(1)}</span>
        <span className="d">/10</span>
      </div>
    </div>
  );
}

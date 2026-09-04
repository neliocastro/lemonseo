export function StatusCard({
  label,
  value,
  note,
  status,
}: {
  label: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  status: "ok" | "warn" | "critical" | "neutral";
}) {
  const icon = { ok: "✅", warn: "⚠️", critical: "❌", neutral: "—" }[status];
  return (
    <div className={`ls-check-card ${status}`}>
      <div className="ls-check-card-head">
        <span>{label}</span>
        <span>{icon}</span>
      </div>
      <div className="ls-check-card-value">{value}</div>
      {note && <div className="ls-check-card-note">{note}</div>}
    </div>
  );
}

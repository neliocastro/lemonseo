import { CheckCircleIcon, WarningTriangleIcon, CloseCircleIcon } from "./icons";

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
  const icon = {
    ok: <CheckCircleIcon size={16} />,
    warn: <WarningTriangleIcon size={16} />,
    critical: <CloseCircleIcon size={16} />,
    neutral: <span style={{ opacity: 0.5 }}>—</span>,
  }[status];
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

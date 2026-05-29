import type { ComfortScore as ComfortScoreType } from "@thanal/shared";

export default function ComfortScore({ comfort }: { comfort: ComfortScoreType }) {
  return (
    <div className="analysis-section">
      <div className="analysis-section-header">
        <span className="analysis-section-label">Comfort score</span>
        <span className="analysis-section-value">{comfort.score}/100</span>
      </div>
      <div className="comfort-bar-track">
        <div className="comfort-bar-fill" style={{ width: `${comfort.score}%` }} />
      </div>
      <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
        {comfort.label.charAt(0).toUpperCase() + comfort.label.slice(1)} conditions
      </span>
    </div>
  );
}

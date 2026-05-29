import type { RouteAnalysis } from "@thanal/shared";

export default function SunTimeline({ analysis }: { analysis: RouteAnalysis }) {
  if (!analysis?.timeline || analysis.timeline.length === 0) return null;

  return (
    <div className="analysis-section">
      <div className="analysis-section-header">
        <span className="analysis-section-label">Sun exposure</span>
        <span className="analysis-section-value">{Math.round(analysis.totalDurationMinutes)} min</span>
      </div>
      <div className="timeline-bar" aria-label="Sun exposure timeline">
        {analysis.timeline.map((segment) => (
          <span
            key={segment.segmentIndex}
            className={`timeline-segment side-${segment.sunSide}`}
            style={{ flexGrow: Math.max(1, segment.distanceMeters) }}
            title={`${segment.sunSide}: ${Math.round(segment.directSunMinutes)} min`}
          />
        ))}
      </div>
      <div className="timeline-legend">
        <span className="legend-item"><span className="legend-dot left" /> Sun left</span>
        <span className="legend-item"><span className="legend-dot right" /> Sun right</span>
        <span className="legend-item"><span className="legend-dot neutral" /> Low/front/back</span>
      </div>
    </div>
  );
}

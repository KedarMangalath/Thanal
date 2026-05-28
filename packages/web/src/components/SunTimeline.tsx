import type { RouteAnalysis } from "@thanal/shared";

export default function SunTimeline({ analysis }: { analysis: RouteAnalysis }) {
  return (
    <section className="result-card">
      <div className="section-heading">
        <span>Sun exposure timeline</span>
        <strong>{Math.round(analysis.totalDurationMinutes)} min</strong>
      </div>
      <div className="timeline-bar" aria-label="Sun exposure timeline">
        {analysis.timeline.map((segment) => (
          <span
            key={segment.segmentIndex}
            className={`timeline-segment side-${segment.sunSide}`}
            style={{
              flexGrow: Math.max(1, segment.distanceMeters)
            }}
            title={`${segment.sunSide}: ${Math.round(segment.directSunMinutes)} minutes`}
          />
        ))}
      </div>
      <div className="timeline-legend">
        <span className="legend left">Sun left</span>
        <span className="legend right">Sun right</span>
        <span className="legend other">Low/front/back</span>
      </div>
    </section>
  );
}

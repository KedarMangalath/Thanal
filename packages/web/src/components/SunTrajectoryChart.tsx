import type { RouteAnalysis } from "@thanal/shared";

type SunTrajectoryChartProps = {
  analysis: RouteAnalysis | null;
};

export default function SunTrajectoryChart({ analysis }: SunTrajectoryChartProps) {
  if (!analysis?.timeline || analysis.timeline.length < 2) return null;

  const points = analysis.timeline.map((segment) => segment.sunAltitudeDegrees);
  const minAlt = Math.min(...points, 0);
  const maxAlt = Math.max(...points, 90);
  const altRange = maxAlt - minAlt;

  // SVG dimensions
  const width = 300;
  const height = 80;
  const padding = 10;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  // Path data
  const step = graphWidth / Math.max(1, points.length - 1);
  const pathD = points
    .map((alt, i) => {
      const x = padding + i * step;
      const y = height - padding - ((alt - minAlt) / Math.max(1, altRange)) * graphHeight;
      return `${i === 0 ? "M" : "L"} ${x},${y}`;
    })
    .join(" ");

  // Glare points
  const glareCircles = analysis.timeline
    .map((segment, i) => {
      if (!segment.glareRisk) return null;
      const x = padding + i * step;
      const y = height - padding - ((segment.sunAltitudeDegrees - minAlt) / Math.max(1, altRange)) * graphHeight;
      return <circle key={i} cx={x} cy={y} r={3} fill="#EF4444" />;
    })
    .filter(Boolean);

  return (
    <div className="sun-chart-card">
      <div className="sun-chart-header">
        <span>Sun Altitude Trajectory</span>
        <span className="sun-chart-sub">Glare marked in red</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="sun-chart-svg">
        <path d={pathD} fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {glareCircles}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeDasharray="4 4" />
      </svg>
    </div>
  );
}

import type { RainBucket } from "@thanal/shared";

export default function RainWindow({
  probability,
  timeline
}: {
  probability: number;
  timeline?: RainBucket[];
}) {
  const buckets =
    timeline && timeline.length > 0
      ? timeline
      : Array.from({ length: 8 }, (_, index) => ({
          time: new Date(Date.now() + index * 60 * 60 * 1000).toISOString(),
          probability: Math.max(0, probability - index * 4)
        }));
  const peak = Math.max(...buckets.map((b) => b.probability), probability);

  return (
    <div className="analysis-section">
      <div className="analysis-section-header">
        <span className="analysis-section-label">Rain window</span>
        <span className="analysis-section-value">{Math.round(peak)}% peak</span>
      </div>
      <div className="rain-chart" aria-label="Rain probability chart">
        {buckets.map((bucket, index) => {
          const heightPct = Math.max(8, bucket.probability); // min 8% height so it's visible even at 0
          return (
            <div key={`${bucket.time}-${index}`} className="rain-bar-container" title={`${formatHour(bucket.time)}: ${Math.round(bucket.probability)}%`}>
              <div className="rain-bar-wrapper">
                <div 
                  className="rain-bar" 
                  style={{ 
                    height: `${heightPct}%`, 
                    opacity: 0.2 + bucket.probability / 125,
                    background: bucket.probability > 50 ? "var(--accent)" : "var(--info, #38bdf8)"
                  }} 
                />
              </div>
              <div className="rain-bar-label">
                {formatHourShort(bucket.time)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatHour(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHourShort(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "numeric", hour12: true }).replace(" ", "").toLowerCase();
}

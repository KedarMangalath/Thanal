import { CloudRain } from "lucide-react";
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
  const peak = Math.max(...buckets.map((bucket) => bucket.probability), probability);

  return (
    <section className="result-card rain">
      <div className="section-heading">
        <span>
          <CloudRain size={16} />
          Rain window
        </span>
        <strong>{Math.round(peak)}% peak</strong>
      </div>
      <div className="rain-strip" aria-label="Rain probability strip">
        {buckets.map((bucket, index) => (
          <span
            key={`${bucket.time}-${index}`}
            title={`${formatHour(bucket.time)}: ${Math.round(bucket.probability)}%`}
            style={{ opacity: 0.2 + bucket.probability / 130 }}
          />
        ))}
      </div>
      <div className="rain-labels">
        <span>{formatHour(buckets[0]?.time)}</span>
        <span>{formatHour(buckets[buckets.length - 1]?.time)}</span>
      </div>
    </section>
  );
}

function formatHour(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

import { CloudRain } from "lucide-react";

export default function RainWindow({ probability }: { probability: number }) {
  const buckets = Array.from({ length: 8 }, (_, index) => Math.max(0, probability - index * 4));

  return (
    <section className="result-card rain">
      <div className="section-heading">
        <span>
          <CloudRain size={16} />
          Rain window
        </span>
        <strong>{Math.round(probability)}%</strong>
      </div>
      <div className="rain-strip" aria-label="Rain probability strip">
        {buckets.map((bucket, index) => (
          <span key={index} style={{ opacity: 0.2 + bucket / 130 }} />
        ))}
      </div>
    </section>
  );
}

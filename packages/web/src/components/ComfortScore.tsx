import type { ComfortScore as ComfortScoreType } from "@thanal/shared";
import { ThermometerSun } from "lucide-react";

export default function ComfortScore({ comfort }: { comfort: ComfortScoreType }) {
  return (
    <section className="result-card comfort">
      <div className="section-heading">
        <span>
          <ThermometerSun size={16} />
          Comfort score
        </span>
        <strong>{comfort.score}</strong>
      </div>
      <div className="score-meter">
        <span style={{ width: `${comfort.score}%` }} />
      </div>
      <small>{comfort.label.toUpperCase()} conditions for this departure window</small>
    </section>
  );
}

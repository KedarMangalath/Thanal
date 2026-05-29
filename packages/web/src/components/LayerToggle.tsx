import { Globe, Layers, Mountain } from "lucide-react";

export type MapLayer = "standard" | "satellite" | "terrain";

const layers: { id: MapLayer; icon: typeof Globe; label: string }[] = [
  { id: "standard", icon: Globe, label: "Standard" },
  { id: "satellite", icon: Layers, label: "Satellite" },
  { id: "terrain", icon: Mountain, label: "Terrain" }
];

export default function LayerToggle({
  active,
  onChange
}: {
  active: MapLayer;
  onChange: (layer: MapLayer) => void;
}) {
  return (
    <div className="layer-toggle glass-card">
      {layers.map(({ id, icon: Icon, label }) => (
        <button
          aria-label={label}
          className={`layer-btn ${active === id ? "active" : ""}`}
          key={id}
          title={label}
          type="button"
          onClick={() => onChange(id)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

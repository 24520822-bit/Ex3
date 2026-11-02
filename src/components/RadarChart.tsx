import type { SquadTelemetry } from "../data/squads";

interface RadarChartProps {
  squadName: string;
  telemetry: SquadTelemetry;
}

const CENTER = { x: 150, y: 120 };
const RADIUS = 78;
const AXES = [
  { key: "kills", label: "Kills", angle: -90 },
  { key: "damage", label: "Damage", angle: 30 },
  { key: "survival", label: "Survival", angle: 150 },
] as const;

function pointsForScale(scale: number): string {
  return AXES.map(({ angle }) => {
    const radians = (angle * Math.PI) / 180;
    const radius = RADIUS * scale;
    const x = CENTER.x + Math.cos(radians) * radius;
    const y = CENTER.y + Math.sin(radians) * radius;
    return `${x},${y}`;
  }).join(" ");
}

export function RadarChart({ squadName, telemetry }: RadarChartProps) {
  const dataPoints = AXES.map(({ key, angle }) => {
    const radians = (angle * Math.PI) / 180;
    const radius = (RADIUS * telemetry[key]) / 100;
    const x = CENTER.x + Math.cos(radians) * radius;
    const y = CENTER.y + Math.sin(radians) * radius;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg
      className="radar-chart"
      viewBox="0 0 300 240"
      role="img"
      aria-label={`Telemetry radar chart for ${squadName}`}
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={pointsForScale(scale)}
          className="radar-grid"
        />
      ))}
      {AXES.map(({ key, label, angle }) => {
        const radians = (angle * Math.PI) / 180;
        const x = CENTER.x + Math.cos(radians) * RADIUS;
        const y = CENTER.y + Math.sin(radians) * RADIUS;
        const labelX = CENTER.x + Math.cos(radians) * (RADIUS + 22);
        const labelY = CENTER.y + Math.sin(radians) * (RADIUS + 22);

        return (
          <g key={key}>
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={x}
              y2={y}
              className="radar-axis"
            />
            <text x={labelX} y={labelY} className="radar-label">
              {label}
            </text>
          </g>
        );
      })}
      <polygon points={dataPoints} className="radar-data" />
      <circle cx={CENTER.x} cy={CENTER.y} r="3" className="radar-center" />
    </svg>
  );
}

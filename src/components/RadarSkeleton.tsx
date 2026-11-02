interface RadarSkeletonProps {
  squadName: string;
}

export function RadarSkeleton({ squadName }: RadarSkeletonProps) {
  return (
    <div
      className="radar-skeleton"
      role="status"
      aria-label={`Loading ${squadName} telemetry`}
    >
      <svg viewBox="0 0 300 240" aria-hidden="true">
        <polygon points="150,42 218,159 82,159" />
        <polygon points="150,62 200,149 100,149" />
        <line x1="150" y1="120" x2="150" y2="42" />
        <line x1="150" y1="120" x2="218" y2="159" />
        <line x1="150" y1="120" x2="82" y2="159" />
        <circle cx="150" cy="120" r="5" />
      </svg>
      <span className="sr-only">Loading {squadName} telemetry</span>
    </div>
  );
}

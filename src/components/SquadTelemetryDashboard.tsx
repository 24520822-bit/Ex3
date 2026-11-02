import { useState } from "react";
import { SQUADS } from "../data/squads";
import type { SquadId } from "../data/squads";
import { requestTelemetry } from "../data/telemetryRequest";
import { useSquadTelemetry } from "../hooks/useSquadTelemetry";
import { RadarChart } from "./RadarChart";
import { RadarSkeleton } from "./RadarSkeleton";

interface SquadTelemetryDashboardProps {
  request?: typeof requestTelemetry;
}

export function SquadTelemetryDashboard({
  request,
}: SquadTelemetryDashboardProps) {
  const [squadId, setSquadId] = useState<SquadId>(SQUADS[0].id);
  const { state } = useSquadTelemetry(squadId, request);
  const selectedSquad = SQUADS.find((squad) => squad.id === squadId);

  if (!selectedSquad) {
    throw new Error(`Unknown squad selected: ${squadId}`);
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">KRAFTON PUBG Vietnam Series</p>
          <h1>PUBG Squad Telemetry</h1>
          <p className="dashboard-description">
            Live squad performance at a glance.
          </p>
        </div>
        <div className="squad-picker">
          <label htmlFor="squad-select">Squad</label>
          <select
            id="squad-select"
            value={squadId}
            onChange={(event) => {
              const nextSquad = SQUADS.find(
                (squad) => squad.id === event.target.value,
              );
              if (nextSquad) setSquadId(nextSquad.id);
            }}
          >
            {SQUADS.map((squad) => (
              <option key={squad.id} value={squad.id}>
                {squad.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section
        className="telemetry-panel"
        aria-label={`${selectedSquad.name} telemetry`}
      >
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Squad overview</p>
            <h2>{selectedSquad.name}</h2>
          </div>
          <span className="live-indicator">
            <span aria-hidden="true" />
            LIVE
          </span>
        </div>

        <div className="radar-stage">
          {state.status === "LOADING" && (
            <RadarSkeleton squadName={selectedSquad.name} />
          )}
          {state.status === "SUCCESS" && state.squadId === squadId && (
            <RadarChart
              squadName={selectedSquad.name}
              telemetry={state.data}
            />
          )}
        </div>
        <p className="chart-caption">
          Squad metrics normalized to a 0–100 scale
        </p>
      </section>
    </main>
  );
}

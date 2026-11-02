export interface SquadTelemetry {
  kills: number;
  damage: number;
  survival: number;
}

export interface Squad {
  id: string;
  name: string;
  telemetry: SquadTelemetry;
}

export const SQUADS = [
  {
    id: "cerberus-esports",
    name: "Cerberus Esports",
    telemetry: { kills: 78, damage: 84, survival: 69 },
  },
  {
    id: "the-expendables",
    name: "The Expendables",
    telemetry: { kills: 71, damage: 77, survival: 74 },
  },
  {
    id: "genius-esports",
    name: "Genius Esports",
    telemetry: { kills: 74, damage: 72, survival: 80 },
  },
] as const satisfies readonly Squad[];

export type SquadId = (typeof SQUADS)[number]["id"];

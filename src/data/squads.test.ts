import { describe, expect, it } from "vitest";
import { SQUADS } from "./squads";

describe("squad telemetry model", () => {
  it("defines the three squads from the exercise", () => {
    expect(SQUADS.map((squad) => squad.name)).toEqual([
      "Cerberus Esports",
      "The Expendables",
      "Genius Esports",
    ]);
  });

  it("uses unique IDs and normalized radar values for every squad", () => {
    const ids = SQUADS.map((squad) => squad.id);

    expect(new Set(ids).size).toBe(3);
    for (const squad of SQUADS) {
      expect(squad.telemetry).toEqual({
        kills: expect.any(Number),
        damage: expect.any(Number),
        survival: expect.any(Number),
      });
      for (const value of Object.values(squad.telemetry)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });
});

import { SQUADS } from "./squads";
import type { SquadId, SquadTelemetry } from "./squads";

export type TelemetryRequestFailure = "packet-loss" | "timeout";

export class TelemetryRequestError extends Error {
  constructor(readonly code: TelemetryRequestFailure) {
    super(
      code === "packet-loss"
        ? "Telemetry packet loss occurred."
        : "Telemetry request timed out.",
    );
    this.name = "TelemetryRequestError";
  }
}

export interface TelemetryRequestOptions {
  signal: AbortSignal;
  random?: () => number;
  delayMs?: number;
  timeoutMs?: number;
}

export function requestTelemetry(
  squadId: SquadId,
  {
    signal,
    random = Math.random,
    delayMs = 800,
    timeoutMs = 4_000,
  }: TelemetryRequestOptions,
): Promise<SquadTelemetry> {
  if (signal.aborted) {
    return Promise.reject(new DOMException("The request was aborted.", "AbortError"));
  }

  const squad = SQUADS.find((candidate) => candidate.id === squadId);
  if (!squad) {
    return Promise.reject(new Error(`Unknown squad: ${squadId}`));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const cleanup = () => {
      for (const timer of timers) clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
    };

    const finishResolve = (telemetry: SquadTelemetry) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(telemetry);
    };

    const finishReject = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const onAbort = () => {
      finishReject(new DOMException("The request was aborted.", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
    timers.push(
      setTimeout(() => {
        if (random() < 0.35) {
          finishReject(new TelemetryRequestError("packet-loss"));
          return;
        }

        finishResolve({ ...squad.telemetry });
      }, delayMs),
    );
    timers.push(
      setTimeout(() => {
        finishReject(new TelemetryRequestError("timeout"));
      }, timeoutMs),
    );
  });
}

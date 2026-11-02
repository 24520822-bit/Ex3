import { useEffect, useState } from "react";
import type { SquadId, SquadTelemetry } from "../data/squads";
import { requestTelemetry } from "../data/telemetryRequest";

export type TelemetryLoadState =
  | { status: "IDLE" }
  | { status: "LOADING"; squadId: SquadId }
  | { status: "SUCCESS"; squadId: SquadId; data: SquadTelemetry }
  | { status: "ERROR"; squadId: SquadId; error: Error };

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useSquadTelemetry(
  squadId: SquadId,
  request: typeof requestTelemetry = requestTelemetry,
) {
  const [state, setState] = useState<TelemetryLoadState>({ status: "IDLE" });
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "LOADING", squadId });

    void request(squadId, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: "SUCCESS", squadId, data });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setState({ status: "ERROR", squadId, error: toError(error) });
      });

    return () => controller.abort();
  }, [request, retryTick, squadId]);

  const currentState =
    state.status !== "IDLE" && state.squadId !== squadId
      ? { status: "LOADING" as const, squadId }
      : state;

  return {
    state: currentState,
    retry: () => setRetryTick((tick) => tick + 1),
  };
}

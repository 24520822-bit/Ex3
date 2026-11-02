import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SquadId, SquadTelemetry } from "../data/squads";
import { requestTelemetry } from "../data/telemetryRequest";
import { useSquadTelemetry } from "./useSquadTelemetry";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

const telemetry: SquadTelemetry = { kills: 12, damage: 34, survival: 56 };

describe("useSquadTelemetry", () => {
  it("moves from loading to success when the request resolves", async () => {
    const pending = deferred<SquadTelemetry>();
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockReturnValue(pending.promise);
    const { result } = renderHook(() =>
      useSquadTelemetry("cerberus-esports", request),
    );

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(result.current.state.status).toBe("LOADING");
    await act(async () => pending.resolve(telemetry));

    expect(result.current.state).toMatchObject({
      status: "SUCCESS",
      squadId: "cerberus-esports",
      data: telemetry,
    });
  });

  it("aborts the prior squad and ignores its late response", async () => {
    const previous = deferred<SquadTelemetry>();
    const current = deferred<SquadTelemetry>();
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockImplementationOnce(() => previous.promise)
      .mockImplementationOnce(() => current.promise);
    const { result, rerender } = renderHook(
      ({ squadId }: { squadId: SquadId }) =>
        useSquadTelemetry(squadId, request),
      { initialProps: { squadId: "cerberus-esports" } },
    );

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    const previousSignal: AbortSignal =
      request.mock.calls[0][1].signal;
    rerender({ squadId: "genius-esports" });

    await waitFor(() => expect(previousSignal.aborted).toBe(true));
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(result.current.state).toMatchObject({
      status: "LOADING",
      squadId: "genius-esports",
    });
    await act(async () => current.resolve(telemetry));
    expect(result.current.state).toMatchObject({
      status: "SUCCESS",
      squadId: "genius-esports",
    });

    await act(async () =>
      previous.resolve({ kills: 99, damage: 99, survival: 99 }),
    );
    expect(result.current.state).toMatchObject({
      status: "SUCCESS",
      squadId: "genius-esports",
      data: telemetry,
    });
  });

  it("starts a fresh request when retry is called", async () => {
    const initial = deferred<SquadTelemetry>();
    const retry = deferred<SquadTelemetry>();
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockImplementationOnce(() => initial.promise)
      .mockImplementationOnce(() => retry.promise);
    const { result } = renderHook(() =>
      useSquadTelemetry("cerberus-esports", request),
    );

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    const initialSignal: AbortSignal = request.mock.calls[0][1].signal;
    act(() => result.current.retry());

    await waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    expect(initialSignal.aborted).toBe(true);
    await act(async () => retry.resolve(telemetry));
    expect(result.current.state.status).toBe("SUCCESS");
  });

  it("enters error state for a real request failure", async () => {
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockRejectedValue(new Error("network failed"));
    const { result } = renderHook(() =>
      useSquadTelemetry("cerberus-esports", request),
    );

    await waitFor(() => expect(result.current.state.status).toBe("ERROR"));
    expect(result.current.state).toMatchObject({
      status: "ERROR",
      error: { message: "network failed" },
    });
  });
});

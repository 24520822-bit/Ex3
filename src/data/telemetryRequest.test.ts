import { afterEach, describe, expect, it, vi } from "vitest";
import { requestTelemetry, TelemetryRequestError } from "./telemetryRequest";

describe("requestTelemetry", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns squad telemetry at the 35% packet-loss boundary", async () => {
    vi.useFakeTimers();
    const request = requestTelemetry("cerberus-esports", {
      signal: new AbortController().signal,
      random: () => 0.35,
      delayMs: 20,
      timeoutMs: 40,
    });

    const result = request.then((telemetry) => telemetry);
    await vi.advanceTimersByTimeAsync(20);
    await expect(result).resolves.toMatchObject({ kills: 78 });
  });

  it("rejects packet loss when the random value is below 0.35", async () => {
    vi.useFakeTimers();
    const request = requestTelemetry("cerberus-esports", {
      signal: new AbortController().signal,
      random: () => 0.349,
      delayMs: 20,
      timeoutMs: 40,
    });

    const result = request.then(
      () => null,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(20);
    const error = await result;
    expect(error).toBeInstanceOf(TelemetryRequestError);
    expect(error).toMatchObject({ code: "packet-loss" });
  });

  it("rejects when the simulated request exceeds its timeout", async () => {
    vi.useFakeTimers();
    const request = requestTelemetry("cerberus-esports", {
      signal: new AbortController().signal,
      random: () => 0.8,
      delayMs: 100,
      timeoutMs: 20,
    });

    const result = request.then(
      () => null,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(20);
    const error = await result;
    expect(error).toMatchObject({ code: "timeout" });
  });

  it("can randomly simulate a timeout before the request delay completes", async () => {
    vi.useFakeTimers();
    const randomValues = [0.8, 0.05];
    const request = requestTelemetry("cerberus-esports", {
      signal: new AbortController().signal,
      random: () => randomValues.shift() ?? 0.8,
      delayMs: 20,
      timeoutMs: 40,
    });

    const result = request.then(
      () => null,
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(40);

    expect(await result).toMatchObject({ code: "timeout" });
  });

  it("rejects with AbortError and clears timers when cancelled", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = requestTelemetry("cerberus-esports", {
      signal: controller.signal,
      random: () => 0.8,
      delayMs: 50,
      timeoutMs: 100,
    });

    const result = request.then(
      () => null,
      (error: unknown) => error,
    );
    controller.abort();
    await vi.advanceTimersByTimeAsync(100);
    expect(await result).toMatchObject({ name: "AbortError" });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects immediately when the signal was already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await requestTelemetry("cerberus-esports", {
      signal: controller.signal,
    }).then(
      () => null,
      (reason: unknown) => reason,
    );

    expect(error).toMatchObject({ name: "AbortError" });
  });
});

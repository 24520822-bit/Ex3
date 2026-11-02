import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { requestTelemetry } from "../data/telemetryRequest";
import { SquadTelemetryDashboard } from "../components/SquadTelemetryDashboard";

describe("telemetry lifecycle integration", () => {
  it("recovers from packet loss using the real simulator and retry UI", async () => {
    const randomValues = [0.349, 0.35, 0.5];
    const request = vi.fn<typeof requestTelemetry>((squadId, options) =>
      requestTelemetry(squadId, {
        ...options,
        random: () => randomValues.shift() ?? 0.5,
        delayMs: 1,
        timeoutMs: 20,
      }),
    );
    const user = userEvent.setup();
    render(<SquadTelemetryDashboard request={request} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telemetry packet loss occurred.",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("recovers from a simulated timeout after a retry", async () => {
    const randomValues = [0.8, 0.05, 0.8, 0.9];
    const request = vi.fn<typeof requestTelemetry>((squadId, options) =>
      requestTelemetry(squadId, {
        ...options,
        random: () => randomValues.shift() ?? 0.9,
        delayMs: 5,
        timeoutMs: 15,
      }),
    );
    const user = userEvent.setup();
    render(<SquadTelemetryDashboard request={request} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telemetry request timed out.",
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });
});

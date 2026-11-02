import userEvent from "@testing-library/user-event";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SquadTelemetry } from "../data/squads";
import {
  requestTelemetry,
  TelemetryRequestError,
} from "../data/telemetryRequest";
import { SquadTelemetryDashboard } from "./SquadTelemetryDashboard";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

const telemetry: SquadTelemetry = { kills: 12, damage: 34, survival: 56 };

describe("SquadTelemetryDashboard", () => {
  it("offers exactly the three squads", () => {
    const request = vi.fn<typeof requestTelemetry>().mockReturnValue(
      new Promise(() => {}),
    );
    render(<SquadTelemetryDashboard request={request} />);

    expect(screen.getByRole("combobox", { name: "Squad" })).toHaveValue(
      "cerberus-esports",
    );
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      "Cerberus Esports",
      "The Expendables",
      "Genius Esports",
    ]);
  });

  it("shows a radar skeleton while telemetry is loading", async () => {
    const request = vi.fn<typeof requestTelemetry>().mockReturnValue(
      new Promise(() => {}),
    );
    render(<SquadTelemetryDashboard request={request} />);

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(
      screen.getByRole("status", {
        name: "Loading Cerberus Esports telemetry",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows the radar chart after telemetry succeeds", async () => {
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockResolvedValue(telemetry);
    render(<SquadTelemetryDashboard request={request} />);

    expect(
      await screen.findByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).toBeInTheDocument();
  });

  it("hides the previous squad chart immediately after changing squads", async () => {
    const first = deferred<SquadTelemetry>();
    const second = deferred<SquadTelemetry>();
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    render(<SquadTelemetryDashboard request={request} />);

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    first.resolve(telemetry);
    expect(
      await screen.findByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox", { name: "Squad" }), {
      target: { value: "genius-esports" },
    });

    expect(
      await screen.findByRole("status", {
        name: "Loading Genius Esports telemetry",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).not.toBeInTheDocument();
  });

  it("announces packet loss inline with a retry action", async () => {
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockRejectedValue(new TelemetryRequestError("packet-loss"));
    render(<SquadTelemetryDashboard request={request} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telemetry packet loss occurred.",
    );
    expect(
      screen.getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
  });

  it("retries a timeout with the keyboard without showing a browser alert", async () => {
    const retryResponse = deferred<SquadTelemetry>();
    const request = vi
      .fn<typeof requestTelemetry>()
      .mockRejectedValueOnce(new TelemetryRequestError("timeout"))
      .mockReturnValueOnce(retryResponse.promise);
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<SquadTelemetryDashboard request={request} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Telemetry request timed out.",
    );
    const retryButton = screen.getByRole("button", { name: "Retry" });
    retryButton.focus();
    expect(retryButton).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("status", {
        name: "Loading Cerberus Esports telemetry",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);

    await act(async () => retryResponse.resolve(telemetry));
    expect(
      await screen.findByRole("img", {
        name: "Telemetry radar chart for Cerberus Esports",
      }),
    ).toBeInTheDocument();
    expect(alert).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});

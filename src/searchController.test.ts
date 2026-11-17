import { afterEach, describe, expect, it, vi } from "vitest";
import { createSearchController, type SearchState } from "./searchController";

describe("createSearchController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("turns a 404 response into an empty state", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    const states: SearchState[] = [];
    const controller = createSearchController((state) => states.push(state));

    controller.setQuery("Atlantis");
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(0);

    expect(states.at(-1)).toMatchObject({
      status: "empty",
      query: "Atlantis",
      countries: [],
    });
  });

  it("publishes a timeout as a reportable error", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Timed out", "TimeoutError")),
    );
    const states: SearchState[] = [];
    const controller = createSearchController((state) => states.push(state));

    controller.setQuery("Japan");
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(0);

    expect(states.at(-1)).toMatchObject({
      status: "error",
      errorKind: "timeout",
      query: "Japan",
    });
  });

  it("does not publish a user cancellation as an error", async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      requestSignal = init?.signal as AbortSignal | undefined;
      return new Promise<Response>((_resolve, reject) => {
        requestSignal?.addEventListener(
          "abort",
          () => reject(requestSignal?.reason),
          { once: true },
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const states: SearchState[] = [];
    const controller = createSearchController((state) => states.push(state));

    controller.setQuery("Canada");
    await vi.advanceTimersByTimeAsync(250);
    expect(fetchMock).toHaveBeenCalledOnce();

    controller.setQuery("");
    await vi.advanceTimersByTimeAsync(0);

    expect(requestSignal?.aborted).toBe(true);
    expect(states.map((state) => state.status)).not.toContain("error");
    expect(states.at(-1)).toMatchObject({ status: "idle", query: "" });
  });

  it("publishes HTTP failures with their distinct error kind", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    const states: SearchState[] = [];
    const controller = createSearchController((state) => states.push(state));

    controller.setQuery("France");
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(0);

    expect(states.at(-1)).toMatchObject({
      status: "error",
      errorKind: "http",
      error: { status: 503 },
    });
  });
});

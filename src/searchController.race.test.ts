import { afterEach, describe, expect, it, vi } from "vitest";
import { createSearchController } from "./searchController";

describe("search request race", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("aborts the earlier request and keeps only the latest results", async () => {
    vi.useFakeTimers();

    const requests: Array<{
      url: string;
      signal: AbortSignal;
      resolve: (response: Response) => void;
    }> = [];

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        const signal = init?.signal;
        if (!(signal instanceof AbortSignal)) {
          reject(new Error("Expected fetch to receive an AbortSignal"));
          return;
        }

        signal.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });

        requests.push({ url: String(input), signal, resolve });
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    let latestState = {
      status: "idle",
      query: "",
      countries: [] as Array<Record<string, unknown>>,
    };
    const controller = createSearchController((state) => {
      latestState = state;
    }, 250);

    controller.setQuery("sp");
    await vi.advanceTimersByTimeAsync(250);
    expect(requests).toHaveLength(1);

    controller.setQuery("spain");
    expect(requests[0].signal.aborted).toBe(true);

    await vi.advanceTimersByTimeAsync(250);
    expect(requests).toHaveLength(2);

    requests[1].resolve({
      ok: true,
      status: 200,
      json: async () => [
        {
          name: "Spain",
          flag: "🇪🇸",
          capital: "Madrid",
          region: "Europe",
          population: 47351567,
          languages: [{ name: "Spanish" }],
        },
      ],
    } as Response);
    requests[0].resolve({
      ok: true,
      status: 200,
      json: async () => [
        {
          name: "Serbia",
          flag: "🇷🇸",
          capital: "Belgrade",
          region: "Europe",
          population: 6641197,
          languages: [{ name: "Serbian" }],
        },
      ],
    } as Response);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(latestState).toMatchObject({
      status: "results",
      query: "spain",
      countries: [{ name: "Spain" }],
    });
    expect(latestState.countries).toHaveLength(1);
  });
});

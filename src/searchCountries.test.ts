import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError, searchCountries } from "./searchCountries";

describe("searchCountries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns countries from a successful response", async () => {
    const countries = [{ name: { common: "Spain" } }];
    const timeoutMock = vi.spyOn(AbortSignal, "timeout");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(countries),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchCountries("Spain")).resolves.toEqual(countries);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://countries.dev/name/Spain",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(timeoutMock).toHaveBeenCalledWith(expect.any(Number));
  });

  it("treats 404 as an empty result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );

    await expect(searchCountries("NoSuchCountry")).resolves.toEqual([]);
  });

  it("throws HttpError for other unsuccessful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(searchCountries("Spain")).rejects.toBeInstanceOf(HttpError);
    await expect(searchCountries("Spain")).rejects.toMatchObject({
      status: 500,
    });
  });

  it("passes the provided abort signal to fetch", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue([]),
    });
    vi.stubGlobal("fetch", fetchMock);

    await searchCountries("Spain", controller.signal);

    expect(fetchMock).toHaveBeenCalledWith("https://countries.dev/name/Spain", {
      signal: expect.any(AbortSignal),
    });
  });

  it("composes the caller signal with a timeout and reports TimeoutError", async () => {
    const callerController = new AbortController();
    const timeoutController = new AbortController();
    const nativeAny = AbortSignal.any.bind(AbortSignal);
    const timeoutMock = vi
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(timeoutController.signal);
    const anyMock = vi
      .spyOn(AbortSignal, "any")
      .mockImplementation((signals) => nativeAny(signals));

    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
        timeoutController.abort(
          new DOMException("The request timed out", "TimeoutError"),
        );
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchCountries("Spain", callerController.signal),
    ).rejects.toMatchObject({ name: "TimeoutError" });

    expect(timeoutMock).toHaveBeenCalledWith(expect.any(Number));
    expect(anyMock).toHaveBeenCalledWith([
      callerController.signal,
      timeoutController.signal,
    ]);
  });

  it("preserves AbortError when the caller cancels the request", async () => {
    const callerController = new AbortController();
    const timeoutController = new AbortController();
    const nativeAny = AbortSignal.any.bind(AbortSignal);
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutController.signal);
    vi.spyOn(AbortSignal, "any").mockImplementation((signals) =>
      nativeAny(signals),
    );

    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        signal?.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
        callerController.abort(new DOMException("Canceled", "AbortError"));
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchCountries("Spain", callerController.signal),
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});

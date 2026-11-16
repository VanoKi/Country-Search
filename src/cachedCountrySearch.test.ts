import { describe, expect, it, vi } from "vitest";
import { createCachedCountrySearch } from "./cachedCountrySearch";

describe("createCachedCountrySearch", () => {
  it("returns a cached response for a repeated query", async () => {
    const countries = [{ name: "Spain" }];
    const requester = vi.fn().mockResolvedValue(countries);
    const search = createCachedCountrySearch(requester);

    await expect(search("Spain")).resolves.toEqual(countries);
    await expect(search("Spain")).resolves.toEqual(countries);

    expect(requester).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent requests without coupling caller cancellation", async () => {
    let resolveRequest: ((countries: unknown[]) => void) | undefined;
    let requestSignal: AbortSignal | undefined;
    const requester = vi.fn((_query: string, signal?: AbortSignal) => {
      requestSignal = signal;
      return new Promise<unknown[]>((resolve) => {
        resolveRequest = resolve;
      });
    });
    const search = createCachedCountrySearch(requester);
    const firstCaller = new AbortController();
    const secondCaller = new AbortController();

    const firstResult = search("Japan", firstCaller.signal);
    const secondResult = search("Japan", secondCaller.signal);

    expect(requester).toHaveBeenCalledTimes(1);
    firstCaller.abort();

    await expect(firstResult).rejects.toMatchObject({ name: "AbortError" });
    expect(requestSignal?.aborted).toBe(false);

    const countries = [{ name: "Japan" }];
    resolveRequest?.(countries);
    await expect(secondResult).resolves.toEqual(countries);
    expect(requestSignal?.aborted).toBe(false);
  });

  it("cancels the shared request when every caller cancels", async () => {
    let requestSignal: AbortSignal | undefined;
    const requester = vi.fn((_query: string, signal?: AbortSignal) => {
      requestSignal = signal;
      return new Promise<unknown[]>((_resolve, reject) => {
        signal?.addEventListener("abort", () => reject(signal.reason), {
          once: true,
        });
      });
    });
    const search = createCachedCountrySearch(requester);
    const firstCaller = new AbortController();
    const secondCaller = new AbortController();
    const firstResult = search("Canada", firstCaller.signal);
    const secondResult = search("Canada", secondCaller.signal);

    firstCaller.abort();
    secondCaller.abort();

    await expect(firstResult).rejects.toMatchObject({ name: "AbortError" });
    await expect(secondResult).rejects.toMatchObject({ name: "AbortError" });
    expect(requestSignal?.aborted).toBe(true);
  });
});

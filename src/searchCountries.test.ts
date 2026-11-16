import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpError, searchCountries } from "./searchCountries";

describe("searchCountries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns countries from a successful response", async () => {
    const countries = [{ name: { common: "Spain" } }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(countries),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchCountries("Spain")).resolves.toEqual(countries);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://countries.dev/name/Spain",
      expect.objectContaining({ signal: undefined }),
    );
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
      signal: controller.signal,
    });
  });
});

import { describe, expect, it } from "vitest";
import { HttpError } from "./searchCountries";
import { classifySearchError } from "./searchError";

describe("classifySearchError", () => {
  it("identifies caller cancellation separately", () => {
    const error = new DOMException("Canceled", "AbortError");

    expect(classifySearchError(error)).toEqual({
      kind: "aborted",
      error,
    });
  });

  it("identifies a timeout as a reportable failure", () => {
    const error = new DOMException("Timed out", "TimeoutError");

    expect(classifySearchError(error)).toEqual({
      kind: "timeout",
      error,
    });
  });

  it("preserves the HTTP error type and status", () => {
    const error = new HttpError(503);

    expect(classifySearchError(error)).toEqual({
      kind: "http",
      error,
    });
  });

  it("classifies network and unknown failures", () => {
    const networkError = new TypeError("Network unavailable");

    expect(classifySearchError(networkError)).toEqual({
      kind: "network",
      error: networkError,
    });
    expect(classifySearchError("unexpected failure")).toMatchObject({
      kind: "network",
      error: { message: "Country search failed" },
    });
  });
});

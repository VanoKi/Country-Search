import { HttpError } from "./searchCountries.js";

export type SearchErrorKind = "aborted" | "timeout" | "http" | "network";

export interface ClassifiedSearchError {
  kind: SearchErrorKind;
  error: Error;
}

export function classifySearchError(error: unknown): ClassifiedSearchError {
  const normalizedError =
    error instanceof Error ? error : new Error("Country search failed");

  if (normalizedError.name === "AbortError") {
    return { kind: "aborted", error: normalizedError };
  }

  if (normalizedError.name === "TimeoutError") {
    return { kind: "timeout", error: normalizedError };
  }

  if (error instanceof HttpError) {
    return { kind: "http", error };
  }

  return { kind: "network", error: normalizedError };
}

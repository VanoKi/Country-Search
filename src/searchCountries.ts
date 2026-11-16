export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Country search failed with HTTP status ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

export async function searchCountries(
  query: string,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  const response = await fetch(
    `https://countries.dev/name/${encodeURIComponent(query)}`,
    { signal: requestSignal },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status);
  }

  return (await response.json()) as unknown[];
}

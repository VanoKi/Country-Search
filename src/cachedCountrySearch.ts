export type CountryRequester = (
  query: string,
  signal?: AbortSignal,
) => Promise<unknown[]>;

interface InFlightRequest {
  controller: AbortController;
  consumers: Set<symbol>;
  settled: boolean;
  promise: Promise<unknown[]>;
}

function getAbortReason(signal: AbortSignal): unknown {
  return (
    signal.reason ?? new DOMException("The request was canceled", "AbortError")
  );
}

export function createCachedCountrySearch(requester: CountryRequester) {
  const cache = new Map<string, unknown[]>();
  const inFlight = new Map<string, InFlightRequest>();

  const subscribe = (
    request: InFlightRequest,
    signal?: AbortSignal,
  ): Promise<unknown[]> => {
    const consumer = Symbol("country-search-consumer");
    request.consumers.add(consumer);

    return new Promise((resolve, reject) => {
      let released = false;

      const release = (): void => {
        if (released) return;
        released = true;
        signal?.removeEventListener("abort", onAbort);
        request.consumers.delete(consumer);

        if (request.consumers.size === 0 && !request.settled) {
          request.controller.abort();
        }
      };

      const onAbort = (): void => {
        release();
        reject(signal ? getAbortReason(signal) : new Error("Request canceled"));
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener("abort", onAbort, { once: true });
      request.promise.then(
        (countries) => {
          if (released) return;
          release();
          resolve(countries);
        },
        (error: unknown) => {
          if (released) return;
          release();
          reject(error);
        },
      );
    });
  };

  return (query: string, signal?: AbortSignal): Promise<unknown[]> => {
    if (signal?.aborted) {
      return Promise.reject(getAbortReason(signal));
    }

    const cachedCountries = cache.get(query);
    if (cachedCountries) {
      return Promise.resolve(cachedCountries);
    }

    let request = inFlight.get(query);
    if (!request) {
      const controller = new AbortController();
      const entry: InFlightRequest = {
        controller,
        consumers: new Set(),
        settled: false,
        promise: Promise.resolve([]),
      };

      let requestPromise: Promise<unknown[]>;
      try {
        requestPromise = requester(query, controller.signal);
      } catch (error) {
        requestPromise = Promise.reject(error);
      }

      entry.promise = requestPromise
        .then((countries) => {
          cache.set(query, countries);
          return countries;
        })
        .finally(() => {
          entry.settled = true;
          if (inFlight.get(query) === entry) {
            inFlight.delete(query);
          }
        });
      inFlight.set(query, entry);
      request = entry;
    }

    return subscribe(request, signal);
  };
}

# Design notes

## Canceling outdated requests

`createSearchController` in `src/searchController.ts` aborts the active
`AbortController` as soon as the input changes. This happens before the debounce
timer is scheduled. Clearing the input follows the same path, so a request that
is already in flight is canceled immediately.

Each request receives its own controller signal. `searchCountries` in
`src/searchCountries.ts` combines that signal with a 10-second
`AbortSignal.timeout` signal using `AbortSignal.any`. The browser can therefore
stop the fetch when the user changes the query, while the timeout remains a
separate failure cause. `classifySearchError` in `src/searchError.ts` ignores
`AbortError` and preserves `TimeoutError`, `HttpError`, and network errors for
the UI.

Aborting the request prevents unnecessary network and response parsing work. A
simple “is this answer current?” flag would only hide stale data after the
response arrives; it would leave the old request running. The controller also
checks its signal and query before publishing a result as a final safeguard.

## Debounce delay

Search input uses a 250 ms delay. This is long enough to combine the short gaps
between keystrokes into one API request, while keeping results responsive after
the user pauses. With no debounce, each keystroke would trigger a request. A
much longer delay would reduce requests further but make the search feel slow.

## Mapping complexity

`mapCountryResponse` in `src/mapCountryResponse.ts` visits the country’s
languages, borders, and currencies once. If those arrays contain `L`, `B`, and
`C` items, respectively, the time complexity is **O(L + B + C)**, or **O(n)**
in the total size of those arrays. The returned arrays require **O(L + B + C)**
additional space.

## Search cache and history

`createCachedCountrySearch` in `src/cachedCountrySearch.ts` uses a `Map` for
completed results and another `Map` for in-flight requests. Cache lookup and
in-flight deduplication are **O(1) average** by query. Storing a response is
**O(1)** map work plus the response reference; cached payloads use **O(S)**
space for `S` response items across cached queries. Each active consumer is
tracked in a `Set`, so adding or removing a caller is **O(1) average**. The
shared network request is aborted only when the final consumer cancels.

The UI stores at most five unique recent query strings in `localStorage`. Its
memory and storage use are bounded by **O(H)**, where `H ≤ 5`.

## Clean-code choices

- **Single responsibility:** `debounce.ts` handles timer reset behavior;
  `searchCountries.ts` owns HTTP and timeout behavior;
  `mapCountryResponse.ts` transforms API records; `searchController.ts` manages
  request lifecycle and state; `app.ts` builds and renders the interface.
- **Pure transformation:** `mapCountryResponse` reads a raw response and
  returns a new card model without mutating the API object.
- **Explicit error types:** `HttpError` stores the HTTP status, and
  `classifySearchError` distinguishes cancellation, timeout, HTTP, and network
  failures before the UI decides what to show.
- **Safe dynamic content:** `app.ts` creates elements and assigns text with
  `textContent`; it does not inject API values as HTML.
- **Typed boundaries:** `CountryCardData` and `SearchState` describe the data
  passed between mapping, request control, and rendering.

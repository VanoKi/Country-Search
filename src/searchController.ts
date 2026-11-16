import { debounce } from "./debounce.js";
import { createCachedCountrySearch } from "./cachedCountrySearch.js";
import {
  mapCountryResponse,
  type CountryCardData,
} from "./mapCountryResponse.js";
import { searchCountries } from "./searchCountries.js";
import { classifySearchError, type SearchErrorKind } from "./searchError.js";

export type SearchStatus = "idle" | "loading" | "results" | "empty" | "error";

export interface SearchState {
  status: SearchStatus;
  query: string;
  countries: CountryCardData[];
  error?: Error;
  errorKind?: Exclude<SearchErrorKind, "aborted">;
}

export type SearchStateListener = (state: SearchState) => void;

export interface SearchController {
  setQuery(query: string): void;
}

export function createSearchController(
  onStateChange: SearchStateListener,
  debounceMs = 250,
): SearchController {
  let activeController: AbortController | undefined;
  let currentQuery = "";
  const cachedSearch = createCachedCountrySearch(searchCountries);

  const emit = (state: SearchState): void => {
    onStateChange(state);
  };

  const runSearch = debounce(async (query: string): Promise<void> => {
    const controller = activeController;
    if (!controller || query !== currentQuery) {
      return;
    }

    emit({ status: "loading", query, countries: [] });

    try {
      const rawCountries = await cachedSearch(query, controller.signal);
      if (controller.signal.aborted || query !== currentQuery) {
        return;
      }

      const countries = rawCountries.map(mapCountryResponse);
      emit({
        status: countries.length > 0 ? "results" : "empty",
        query,
        countries,
      });
    } catch (error) {
      const failure = classifySearchError(error);
      if (failure.kind === "aborted") {
        return;
      }

      if (controller.signal.aborted || query !== currentQuery) {
        return;
      }

      emit({
        status: "error",
        query,
        countries: [],
        error: failure.error,
        errorKind: failure.kind,
      });
    }
  }, debounceMs);

  return {
    setQuery(query: string): void {
      currentQuery = query.trim();
      activeController?.abort();
      activeController = undefined;

      if (!currentQuery) {
        emit({ status: "idle", query: "", countries: [] });
        return;
      }

      activeController = new AbortController();
      emit({ status: "loading", query: currentQuery, countries: [] });
      runSearch(currentQuery);
    },
  };
}

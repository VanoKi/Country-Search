import {
  createSearchController,
  type SearchState,
} from "./searchController.js";
import type { CountryCardData } from "./mapCountryResponse.js";

const SEARCH_HISTORY_KEY = "country-search-history";
const SEARCH_HISTORY_LIMIT = 5;

function loadSearchHistory(): string[] {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((query): query is string => typeof query === "string")
          .slice(0, SEARCH_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function makeElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tagName);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatPopulation(population: number): string {
  return new Intl.NumberFormat("en-US").format(population);
}

export function mountCountrySearch(root: HTMLElement): void {
  const shell = makeElement("main", "app-shell");
  const masthead = makeElement("header", "masthead");
  const brand = makeElement("a", "brand", "Country Search");
  brand.href = "#top";
  const mastheadNote = makeElement(
    "span",
    "masthead-note",
    "COUNTRY DIRECTORY",
  );
  masthead.append(brand, mastheadNote);

  const hero = makeElement("section", "hero");
  hero.id = "top";
  const eyebrow = makeElement("p", "eyebrow", "COUNTRY DIRECTORY");
  const title = makeElement("h1", "hero-title", "Find a country");
  const intro = makeElement(
    "p",
    "hero-copy",
    "Search by name to explore capitals, regions and country details.",
  );

  const searchForm = makeElement("form", "search-form");
  searchForm.setAttribute("role", "search");
  const inputLabel = makeElement("label", "sr-only", "Search by country name");
  inputLabel.htmlFor = "country-query";
  const searchMark = makeElement("span", "search-mark", "⌕");
  searchMark.setAttribute("aria-hidden", "true");
  const input = makeElement("input", "search-input");
  input.id = "country-query";
  input.type = "search";
  input.name = "country";
  input.placeholder = "Search countries…";
  input.autocomplete = "off";
  input.setAttribute("aria-describedby", "search-note");
  const searchNote = makeElement(
    "span",
    "search-note",
    "Type a country name · results update as you go",
  );
  searchNote.id = "search-note";
  const historyPanel = makeElement("div", "history-panel");
  historyPanel.hidden = true;
  const historyLabel = makeElement("span", "history-label", "RECENT SEARCHES");
  const historyItems = makeElement("div", "history-items");
  historyPanel.append(historyLabel, historyItems);
  searchForm.append(inputLabel, searchMark, input);
  hero.append(eyebrow, title, intro, searchForm, searchNote, historyPanel);

  const content = makeElement("section", "content-area");
  content.setAttribute("aria-label", "Country search results");
  const resultsHeading = makeElement("div", "results-heading");
  const sectionLabel = makeElement("p", "eyebrow", "SEARCH RESULTS");
  const resultsTitle = makeElement(
    "h2",
    "section-title",
    "Start with a search",
  );
  resultsHeading.append(sectionLabel, resultsTitle);

  const stateMessage = makeElement("div", "state-message");
  stateMessage.setAttribute("role", "status");
  stateMessage.setAttribute("aria-live", "polite");
  const resultLayout = makeElement("div", "result-layout");
  const results = makeElement("div", "country-grid");
  const details = makeElement("aside", "detail-panel");
  details.setAttribute("aria-label", "Country details");
  resultLayout.append(results, details);
  content.append(resultsHeading, stateMessage, resultLayout);

  const footer = makeElement("footer", "site-footer");
  footer.append(
    makeElement("span", "footer-mark", "COUNTRY SEARCH"),
    makeElement("span", "footer-copy", "Country data, made easy to explore."),
  );

  shell.append(masthead, hero, content, footer);
  root.replaceChildren(shell);

  let selectedCountry: CountryCardData | undefined;
  let latestState: SearchState = {
    status: "idle",
    query: "",
    countries: [],
  };
  let history = loadSearchHistory();
  const controller = createSearchController(renderState);

  function renderHistory(): void {
    historyPanel.hidden = history.length === 0;
    const historyButtons = history.map((query) => {
      const button = makeElement("button", "history-item", query);
      button.type = "button";
      button.addEventListener("click", () => {
        input.value = query;
        controller.setQuery(query, { immediate: true });
        input.focus();
      });
      return button;
    });
    historyItems.replaceChildren(...historyButtons);
  }

  function rememberQuery(query: string): void {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    history = [
      normalizedQuery,
      ...history.filter(
        (previousQuery) =>
          previousQuery.toLocaleLowerCase() !==
          normalizedQuery.toLocaleLowerCase(),
      ),
    ].slice(0, SEARCH_HISTORY_LIMIT);

    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Search remains available if browser storage is disabled or full.
    }
    renderHistory();
  }

  function renderDetails(country: CountryCardData | undefined): void {
    if (!country) {
      details.replaceChildren();
      details.classList.remove("detail-panel-visible");
      return;
    }

    details.classList.add("detail-panel-visible");
    const panelHeader = makeElement("div", "detail-header");
    const detailEyebrow = makeElement("p", "eyebrow", "COUNTRY PROFILE");
    const closeButton = makeElement("button", "detail-close", "Close");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close country details");
    closeButton.addEventListener("click", () => {
      selectedCountry = undefined;
      renderDetails(undefined);
      renderCards(latestState.countries);
    });
    panelHeader.append(detailEyebrow, closeButton);

    const countryName = makeElement("h3", "detail-title", country.name);
    const flag = makeElement("span", "detail-flag", country.flag || "🌐");
    flag.setAttribute("aria-hidden", "true");
    const countryDescription = makeElement(
      "p",
      "detail-description",
      [country.capital, country.region].filter(Boolean).join(" · ") ||
        "Country profile",
    );
    const stats = makeElement("dl", "detail-stats");

    const appendDetail = (label: string, value: string): void => {
      const item = makeElement("div", "detail-stat");
      item.append(
        makeElement("dt", "detail-label", label),
        makeElement("dd", "detail-value", value),
      );
      stats.append(item);
    };

    appendDetail("Capital", country.capital || "Not listed");
    appendDetail("Region", country.region || "Not listed");
    appendDetail("Population", formatPopulation(country.population));
    appendDetail(
      "Area",
      country.area === undefined
        ? "Not listed"
        : `${formatPopulation(country.area)} km²`,
    );
    appendDetail(
      "Borders",
      country.borders?.length ? country.borders.join(", ") : "None listed",
    );
    appendDetail(
      "Languages",
      country.languages.length ? country.languages.join(", ") : "Not listed",
    );
    appendDetail(
      "Currency",
      country.currencies?.length
        ? country.currencies
            .map((currency) =>
              [currency.name, currency.code, currency.symbol]
                .filter(Boolean)
                .join(" · "),
            )
            .join(", ")
        : "Not listed",
    );

    details.replaceChildren(
      panelHeader,
      flag,
      countryName,
      countryDescription,
      stats,
    );
  }

  function renderCards(countries: CountryCardData[]): void {
    const cards = countries.map((country) => {
      const card = makeElement("button", "country-card");
      card.type = "button";
      card.setAttribute("aria-pressed", String(selectedCountry === country));

      const cardTop = makeElement("span", "card-topline");
      const flag = makeElement("span", "card-flag", country.flag || "🌐");
      flag.setAttribute("aria-hidden", "true");
      const region = makeElement("span", "card-region", country.region || "—");
      cardTop.append(flag, region);

      const name = makeElement("span", "card-name", country.name);
      const capital = makeElement(
        "span",
        "card-capital",
        country.capital ? `Capital · ${country.capital}` : "Capital not listed",
      );
      const cardBottom = makeElement("span", "card-bottom");
      cardBottom.append(
        makeElement("span", "card-label", "POPULATION"),
        makeElement(
          "span",
          "card-population",
          formatPopulation(country.population),
        ),
      );
      card.append(cardTop, name, capital, cardBottom);
      card.addEventListener("click", () => {
        selectedCountry = country;
        renderCards(latestState.countries);
        renderDetails(country);
      });
      return card;
    });
    results.replaceChildren(...cards);
  }

  function renderState(state: SearchState): void {
    latestState = state;
    if (
      state.status === "results" ||
      state.status === "empty" ||
      state.status === "error"
    ) {
      rememberQuery(state.query);
    }
    results.replaceChildren();
    stateMessage.replaceChildren();
    stateMessage.className = "state-message";

    if (state.status === "idle") {
      stateMessage.append(
        makeElement("span", "state-symbol", "✳"),
        makeElement("p", "state-title", "A world of places awaits."),
        makeElement(
          "p",
          "state-copy",
          "Enter a country name above to begin exploring.",
        ),
      );
      renderDetails(undefined);
      return;
    }

    if (state.status === "loading") {
      stateMessage.classList.add("state-message-loading");
      stateMessage.append(
        makeElement("span", "loading-indicator"),
        makeElement("p", "state-title", `Looking for ${state.query}…`),
        makeElement("p", "state-copy", "Gathering a few details for you."),
      );
      renderDetails(undefined);
      return;
    }

    if (state.status === "empty") {
      stateMessage.append(
        makeElement("span", "state-symbol", "⌕"),
        makeElement("p", "state-title", "No country found."),
        makeElement(
          "p",
          "state-copy",
          `We couldn't find a match for “${state.query}”. Try another spelling.`,
        ),
      );
      renderDetails(undefined);
      return;
    }

    if (state.status === "error") {
      const errorTitle =
        state.errorKind === "timeout"
          ? "The search took too long."
          : state.errorKind === "http"
            ? "The country service is unavailable."
            : "We couldn't complete that search.";
      stateMessage.classList.add("state-message-error");
      const retryButton = makeElement("button", "retry-button", "Try again");
      retryButton.type = "button";
      retryButton.addEventListener("click", () =>
        controller.setQuery(state.query),
      );
      stateMessage.append(
        makeElement("span", "state-symbol", "!"),
        makeElement("p", "state-title", errorTitle),
        makeElement(
          "p",
          "state-copy",
          state.error?.message || "Check your connection and try again.",
        ),
        retryButton,
      );
      renderDetails(undefined);
      return;
    }

    resultsTitle.textContent = `${state.countries.length} ${state.countries.length === 1 ? "country" : "countries"}`;
    if (state.countries.length > 0) {
      stateMessage.append(
        makeElement("span", "results-query-label", "RESULTS FOR"),
        makeElement("span", "results-query", state.query),
      );
    }
    if (
      selectedCountry &&
      !state.countries.some((country) => country.name === selectedCountry?.name)
    ) {
      selectedCountry = undefined;
    }
    renderCards(state.countries);
    if (selectedCountry) {
      const updatedSelection = state.countries.find(
        (country) => country.name === selectedCountry?.name,
      );
      selectedCountry = updatedSelection;
      renderDetails(updatedSelection);
    } else {
      renderDetails(undefined);
    }
  }

  searchForm.addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", () => controller.setQuery(input.value));
  renderHistory();
  renderState(latestState);
}

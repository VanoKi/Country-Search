export interface CountryCardData {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
}

interface RawCountry {
  name?: unknown;
  flag?: unknown;
  capital?: unknown;
  region?: unknown;
  population?: unknown;
  languages?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((language: unknown) => {
    if (!isRecord(language) || typeof language.name !== "string") {
      return [];
    }

    return [language.name];
  });
}

export function mapCountryResponse(raw: unknown): CountryCardData {
  const country = isRecord(raw) ? (raw as RawCountry) : {};

  return {
    name: typeof country.name === "string" ? country.name : "",
    flag: typeof country.flag === "string" ? country.flag : "",
    capital: typeof country.capital === "string" ? country.capital : "",
    region: typeof country.region === "string" ? country.region : "",
    population:
      typeof country.population === "number" &&
      Number.isFinite(country.population)
        ? country.population
        : 0,
    languages: getLanguages(country.languages),
  };
}

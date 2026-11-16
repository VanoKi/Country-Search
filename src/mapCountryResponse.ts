export interface CountryCardData {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
  area?: number;
  borders?: string[];
  currencies?: CurrencyData[];
}

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
}

interface RawCountry {
  name?: unknown;
  flag?: unknown;
  capital?: unknown;
  region?: unknown;
  population?: unknown;
  languages?: unknown;
  area?: unknown;
  borders?: unknown;
  currencies?: unknown;
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

function getBorders(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((border): border is string => typeof border === "string")
    : [];
}

function getCurrencies(value: unknown): CurrencyData[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((currency: unknown) => {
    if (!isRecord(currency)) {
      return [];
    }

    return [
      {
        code: typeof currency.code === "string" ? currency.code : "",
        name: typeof currency.name === "string" ? currency.name : "",
        symbol: typeof currency.symbol === "string" ? currency.symbol : "",
      },
    ];
  });
}

export function mapCountryResponse(raw: unknown): CountryCardData {
  const country = isRecord(raw) ? (raw as RawCountry) : {};

  const mappedCountry: CountryCardData = {
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

  if (typeof country.area === "number" && Number.isFinite(country.area)) {
    mappedCountry.area = country.area;
  }

  if (Array.isArray(country.borders)) {
    mappedCountry.borders = getBorders(country.borders);
  }

  if (Array.isArray(country.currencies)) {
    mappedCountry.currencies = getCurrencies(country.currencies);
  }

  return mappedCountry;
}

import { describe, expect, it } from "vitest";
import { mapCountryResponse } from "./mapCountryResponse";

describe("mapCountryResponse", () => {
  it("maps a countries.dev response to country card data", () => {
    const rawCountry = {
      name: "Spain",
      flag: "🇪🇸",
      capital: "Madrid",
      region: "Europe",
      population: 47351567,
      languages: [
        {
          iso639_1: "es",
          iso639_2: "spa",
          name: "Spanish",
          nativeName: "Español",
        },
      ],
    };

    expect(mapCountryResponse(rawCountry)).toEqual({
      name: "Spain",
      flag: "🇪🇸",
      capital: "Madrid",
      region: "Europe",
      population: 47351567,
      languages: ["Spanish"],
    });
  });

  it("does not modify the API response", () => {
    const rawCountry = {
      name: "Spain",
      flag: "🇪🇸",
      capital: "Madrid",
      region: "Europe",
      population: 47351567,
      languages: [{ name: "Spanish" }],
    };
    const originalCountry = structuredClone(rawCountry);

    mapCountryResponse(rawCountry);

    expect(rawCountry).toEqual(originalCountry);
  });

  it("maps detail fields for the country detail view", () => {
    const rawCountry = {
      name: "Spain",
      flag: "🇪🇸",
      capital: "Madrid",
      region: "Europe",
      population: 47351567,
      languages: [{ name: "Spanish" }],
      area: 505990,
      borders: ["AND", "FRA", "GIB", "PRT"],
      currencies: [{ code: "EUR", name: "Euro", symbol: "€" }],
    };

    expect(mapCountryResponse(rawCountry)).toMatchObject({
      area: 505990,
      borders: ["AND", "FRA", "GIB", "PRT"],
      currencies: [{ code: "EUR", name: "Euro", symbol: "€" }],
    });
  });
});

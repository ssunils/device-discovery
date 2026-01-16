import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";

export interface FormattedPhone {
  raw: string;
  digits: string;
  formatted: string;
  countryCode: string | null;
  nationalNumber: string;
  flag: string;
  countryName: string;
}

const EN_DISPLAY = new Intl.DisplayNames(["en"], { type: "region" });

const fromCountryToFlag = (country?: string) => {
  if (!country) return "🏳️";
  return country
    .toUpperCase()
    .split("")
    .map((char) =>
      char >= "A" && char <= "Z"
        ? String.fromCodePoint(char.charCodeAt(0) + 127397)
        : ""
    )
    .join("");
};

export function formatPhoneNumber(raw: string): FormattedPhone {
  const digits = raw.replace(/\D/g, "");
  const maybeInput = raw.trim().startsWith("+") ? raw.trim() : `+${digits}`;
  const parsed = parsePhoneNumberFromString(maybeInput);
  const countryCode = parsed?.countryCallingCode || null;
  const formatted = parsed?.formatInternational() || raw;
  const nationalNumber = parsed?.nationalNumber || digits;
  const country = parsed?.country as CountryCode | undefined;

  let countryName = "Unknown";
  if (country) {
    try {
      countryName = EN_DISPLAY.of(country) || "Unknown";
    } catch {
      countryName = "Unknown";
    }
  }

  return {
    raw,
    digits,
    formatted,
    countryCode,
    nationalNumber,
    flag: fromCountryToFlag(country),
    countryName,
  };
}

export function maskDigits(input: string, maskChar: string = "\u2022"): string {
  return input.replace(/\d/g, maskChar);
}

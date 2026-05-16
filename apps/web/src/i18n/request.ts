import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from "./config";

function pickLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  for (const part of header.split(",")) {
    const tag = part.trim().split(";")[0].toLowerCase();
    if (tag.startsWith("uk")) return "uk";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;

  let locale: Locale;
  if (isLocale(fromCookie)) {
    locale = fromCookie;
  } else {
    const h = await headers();
    locale = pickLocaleFromAcceptLanguage(h.get("accept-language"));
  }

  if (!SUPPORTED_LOCALES.includes(locale)) locale = DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

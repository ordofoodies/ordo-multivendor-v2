import { getUserLocale } from "@/lib/utils/methods/";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE } from "@/lib/utils/constants/global";

type Messages = Record<string, unknown>;

// fill keys missing from a partial translation with the English text
const withFallback = (messages: Messages, fallback: Messages): Messages => {
  const merged: Messages = { ...fallback };
  Object.entries(messages).forEach(([key, value]) => {
    const base = fallback[key];
    merged[key] =
      value && typeof value === "object" && base && typeof base === "object"
        ? withFallback(value as Messages, base as Messages)
        : value;
  });
  return merged;
};

export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  const messages = (await import(`../locales/${locale}.json`)).default;

  return {
    locale,
    messages:
      locale === DEFAULT_LOCALE
        ? messages
        : withFallback(
            messages,
            (await import(`../locales/${DEFAULT_LOCALE}.json`)).default
          ),
  };
});

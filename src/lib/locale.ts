import { cookies } from "next/headers";
// Extensionless: this module is bundled by Turbopack, which does not resolve
// the ".js"-for-".ts" form that the tsx-run scripts under scripts/ require.
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./i18n";

/** Current locale from the cookie. Server-side only. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

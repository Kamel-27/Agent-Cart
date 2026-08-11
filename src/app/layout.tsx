import type { Metadata } from "next";
import { dirFor, t } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Cart",
  description: "AI-assisted electronics storefront",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    // `dir` here is what makes every CSS logical property in globals.css
    // resolve correctly. It is the only RTL switch in the codebase.
    <html lang={locale} dir={dirFor(locale)}>
      <body>
        <SiteHeader locale={locale} />
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            {t(locale, "site.name")} — {t(locale, "site.tagline")}
          </div>
        </footer>
      </body>
    </html>
  );
}

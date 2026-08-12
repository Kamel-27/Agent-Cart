import type { Metadata } from "next";
import { dirFor } from "@/lib/i18n";
import { getLocale } from "@/lib/locale";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader locale={locale} />
        <main>{children}</main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import { safeRedirect } from "@/lib/redirect";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const requested = form.get("locale");

  const response = NextResponse.redirect(
    safeRedirect(request, form.get("redirect_to") ?? request.headers.get("referer")),
    303,
  );

  if (isLocale(requested)) {
    response.cookies.set(LOCALE_COOKIE, requested, {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

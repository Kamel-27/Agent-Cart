import type { NextRequest } from "next/server";

/**
 * Resolve a post-action redirect target to an absolute URL on THIS origin.
 *
 * Both the `redirect_to` form field and the `Referer` header are attacker-
 * controllable, so neither may be used as a redirect target directly — that is
 * a textbook open redirect, and open redirects are what turn a phishing link
 * into one that appears to come from your own domain.
 *
 * Only the path, query, and fragment are taken from the input; the origin is
 * always the current request's.
 */
export function safeRedirect(request: NextRequest, candidate: unknown, fallback = "/"): URL {
  const origin = request.nextUrl.origin;

  if (typeof candidate === "string" && candidate.length > 0) {
    try {
      // Resolving against our own origin neutralizes absolute URLs pointing
      // elsewhere, and protocol-relative "//evil.com" forms along with them.
      const resolved = new URL(candidate, origin);
      if (resolved.origin === origin) {
        return new URL(resolved.pathname + resolved.search, origin);
      }
    } catch {
      // Malformed input falls through to the fallback.
    }
  }

  return new URL(fallback, origin);
}

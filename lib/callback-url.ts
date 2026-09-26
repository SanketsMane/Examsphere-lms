/**
 * Where to send someone after they log in or sign up, taken from `?callbackUrl=`.
 *
 * Only same-site paths are accepted ("/courses?search=JEE"), never "//evil.com" or
 * "https://…", so the parameter can't be used as an open redirect.
 */
export function safeCallbackUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  return raw;
}

/** Reads and validates `callbackUrl` from the current page's query string (client only). */
export function currentCallbackUrl(): string | null {
  if (typeof window === "undefined") return null;
  return safeCallbackUrl(new URLSearchParams(window.location.search).get("callbackUrl"));
}

/** Appends `callbackUrl` to an auth page link when there is one to carry along. */
export function withCallbackUrl(path: string, callbackUrl: string | null): string {
  return callbackUrl ? `${path}?callbackUrl=${encodeURIComponent(callbackUrl)}` : path;
}

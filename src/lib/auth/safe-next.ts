const AUTH_PAGES = new Set(["/login", "/registro"]);
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

function isRelativeSameOrigin(value: string): boolean {
  if (!value.startsWith("/")) return false;
  // "//host" and "/\host" are interpreted by browsers as another origin.
  if (value[1] === "/" || value[1] === "\\") return false;
  if (value.includes("\\") || CONTROL_CHARS.test(value)) return false;
  return true;
}

/**
 * Validates a user-supplied post-login destination. Returns the path only if
 * it is a same-origin relative path (prevents open redirects), otherwise the
 * fallback (null by default).
 */
export function safeNextPath(
  value: unknown,
  fallback: string | null = null,
): string | null {
  if (typeof value !== "string" || !isRelativeSameOrigin(value)) {
    return fallback;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!isRelativeSameOrigin(decoded)) return fallback;

  const pathname = value.split(/[?#]/, 1)[0];
  if (AUTH_PAGES.has(pathname)) return fallback;

  return value;
}

/**
 * Security utilities for Nova AI Assistant
 * Enforces URL safety, protocol validation, and prevents arbitrary code execution.
 */

// Permitted protocols for external navigation & mobile intents
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'tel:', 'mailto:', 'sms:', 'maps:']);

// Blocked dangerous protocols that could execute arbitrary code
const BLOCKED_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'blob:',
  'about:',
]);

/**
 * Validates whether a URL or mobile URI is safe to open in the browser or system intent.
 * Permitted: HTTP, HTTPS, and verified mobile intent schemes (tel, mailto, sms, maps).
 */
export function isValidSafeUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;

  const trimmed = urlString.trim();

  // Explicit check for blocked dangerous protocols
  const lower = trimmed.toLowerCase();
  for (const blocked of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(blocked)) {
      console.warn(`[Security Alert] Blocked attempt to navigate to dangerous protocol: ${blocked}`);
      return false;
    }
  }

  // 1. Mobile Intent: tel: (Must only contain valid phone dialing characters)
  if (lower.startsWith('tel:')) {
    const phonePart = trimmed.substring(4);
    // Allow digits, +, -, ., (, ), and spaces
    return /^\+?[0-9\s\-().]{3,25}$/.test(phonePart);
  }

  // 2. Mobile Intent: mailto: (Must be valid email format)
  if (lower.startsWith('mailto:')) {
    const emailPart = trimmed.substring(7);
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\?.*)?$/.test(emailPart);
  }

  // 3. Mobile Intent: sms:
  if (lower.startsWith('sms:')) {
    const smsPart = trimmed.substring(4);
    return /^\+?[0-9\s\-().]{3,25}(?:\?.*)?$/.test(smsPart);
  }

  // 4. Mobile Intent: maps:
  if (lower.startsWith('maps:')) {
    return /^maps:(?:\?q=|ll=)?[a-zA-Z0-9\s,._\-+]+$/i.test(trimmed);
  }

  try {
    // Add https:// if protocol is missing (e.g. "google.com" -> "https://google.com")
    const formattedUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    const parsed = new URL(formattedUrl);

    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      console.warn(`[Security Alert] Protocol "${parsed.protocol}" is not in allowed list.`);
      return false;
    }

    // Must have a valid hostname with at least one dot or be localhost
    if (!parsed.hostname || (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes and formats a safe URL or mobile intent string.
 * Returns null if the URL fails security validation.
 */
export function sanitizeUrl(urlString: string): string | null {
  if (!isValidSafeUrl(urlString)) return null;

  const trimmed = urlString.trim();
  const lower = trimmed.toLowerCase();

  // Return sanitized mobile intents directly
  if (
    lower.startsWith('tel:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('sms:') ||
    lower.startsWith('maps:')
  ) {
    return trimmed;
  }

  const formattedUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(formattedUrl);
    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Constructs a safe Google Search URL with proper query encoding.
 */
export function createSafeGoogleSearchUrl(query: string): string {
  const sanitizedQuery = query.trim();
  return `https://www.google.com/search?q=${encodeURIComponent(sanitizedQuery)}`;
}

/**
 * Constructs a safe YouTube Search / Home URL.
 */
export function createSafeYouTubeUrl(query?: string): string {
  if (!query || !query.trim()) {
    return 'https://www.youtube.com';
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}

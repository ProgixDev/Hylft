export function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs < 1000) return String(Math.round(n));
  if (abs < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function formatMemberSince(iso: string | null | undefined, locale = "en"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const lang = locale.startsWith("fr") ? "fr-FR" : "en-US";
  const m = d.toLocaleString(lang, { month: "short" });
  const capitalized = m.charAt(0).toUpperCase() + m.slice(1);
  return `${capitalized} ${d.getFullYear()}`;
}

/**
 * Formats a post timestamp as a relative string up to 48h, then switches to an
 * absolute short date + time. Returns the input unchanged if it's not parseable
 * (e.g. already pre-formatted like "2h ago" from mock data).
 */
export function formatPostTimestamp(
  input: string | null | undefined,
  locale = "en",
): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  const fr = locale.startsWith("fr");
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return fr ? "à l’instant" : "just now";
  if (diffMin < 60)
    return fr
      ? `il y a ${diffMin} min`
      : `${diffMin} min ago`;
  if (diffHr < 48)
    return fr ? `il y a ${diffHr} h` : `${diffHr}h ago`;

  const lang = fr ? "fr-FR" : "en-US";
  const date = d.toLocaleDateString(lang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}

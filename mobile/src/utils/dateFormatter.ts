import i18n from "./i18n";

/**
 * Get the locale string based on current i18n language
 */
function getLocale(): string {
  return i18n.language === "fr" ? "fr-FR" : "en-US";
}

/**
 * Format a date string to a localized date string
 */
export function formatDate(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(dateStr + "T00:00:00");
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return date.toLocaleDateString(getLocale(), options || defaultOptions);
}

/**
 * Format a date to a short date string (e.g., "Mon, Jan 1")
 */
export function formatShortDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  return dateObj.toLocaleDateString(getLocale(), options || defaultOptions);
}

/**
 * Format a date to display date (e.g., "January 1, 2026")
 */
export function formatDisplayDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return dateObj.toLocaleDateString(getLocale(), options || defaultOptions);
}

/**
 * Format a date to weekday name (e.g., "Monday")
 */
export function formatWeekday(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date + "T00:00:00") : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: "long",
  };
  return dateObj.toLocaleDateString(getLocale(), options || defaultOptions);
}

/**
 * Format a time string
 */
export function formatTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  return dateObj.toLocaleTimeString(getLocale(), options || defaultOptions);
}

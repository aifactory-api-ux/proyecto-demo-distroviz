/**
 * Date utility functions for DistroViz frontend
 * Handles ISO date formatting and parsing for distribution data
 */

import { format, parseISO, isValid, differenceInDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { enUS } from 'date-fns/locale/en-US';

// Supported locales
type LocaleType = 'es' | 'en';

/**
 * Get locale object for date-fns
 */
function getLocale(locale?: LocaleType) {
  switch (locale) {
    case 'en':
      return enUS;
    case 'es':
    default:
      return es;
  }
}

/**
 * Format an ISO date string for display in the UI
 * @param isoDate - ISO date string (e.g., "2024-04-01T10:00:00Z")
 * @param formatStr - Format pattern (default: "dd MMM yyyy")
 * @param locale - Locale code ('es' or 'en')
 * @returns Formatted date string or empty string if invalid
 */
export function formatDate(
  isoDate: string | null | undefined,
  formatStr: string = 'dd MMM yyyy',
  locale?: LocaleType
): string {
  if (!isoDate) {
    return '-';
  }

  try {
    const date = parseISO(isoDate);
    if (!isValid(date)) {
      return '-';
    }
    return format(date, formatStr, { locale: getLocale(locale) });
  } catch {
    return '-';
  }
}

/**
 * Format an ISO datetime string with time
 * @param isoDate - ISO datetime string
 * @param locale - Locale code
 * @returns Formatted datetime string
 */
export function formatDateTime(
  isoDate: string | null | undefined,
  locale?: LocaleType
): string {
  return formatDate(isoDate, 'dd MMM yyyy HH:mm', locale);
}

/**
 * Format a date for chart axis labels
 * @param isoDate - ISO date string
 * @param locale - Locale code
 * @returns Short formatted date
 */
export function formatChartDate(
  isoDate: string | null | undefined,
  locale?: LocaleType
): string {
  return formatDate(isoDate, 'dd/MM', locale);
}

/**
 * Format a date for table display
 * @param isoDate - ISO datetime string
 * @param locale - Locale code
 * @returns Table-friendly date format
 */
export function formatTableDate(
  isoDate: string | null | undefined,
  locale?: LocaleType
): string {
  return formatDate(isoDate, 'dd/MM/yyyy HH:mm', locale);
}

/**
 * Parse an ISO date string to Date object
 * @param isoDate - ISO date string
 * @returns Date object or null if invalid
 */
export function parseDate(isoDate: string | null | undefined): Date | null {
  if (!isoDate) {
    return null;
  }

  try {
    const date = parseISO(isoDate);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/**
 * Calculate the number of days between two dates
 * @param fromDate - Start date (ISO string)
 * @param toDate - End date (ISO string)
 * @returns Number of days difference (positive if toDate is after fromDate)
 */
export function daysBetween(
  fromDate: string | null | undefined,
  toDate: string | null | undefined
): number | null {
  const from = parseDate(fromDate);
  const to = parseDate(toDate);

  if (!from || !to) {
    return null;
  }

  return differenceInDays(to, from);
}

/**
 * Check if a date is after another date
 * @param date - Date to check (ISO string)
 * @param compareDate - Date to compare against (ISO string)
 * @returns True if date is after compareDate
 */
export function isDateAfter(
  date: string | null | undefined,
  compareDate: string | null | undefined
): boolean {
  const d = parseDate(date);
  const cd = parseDate(compareDate);

  if (!d || !cd) {
    return false;
  }

  return isAfter(d, cd);
}

/**
 * Check if a date is before another date
 * @param date - Date to check (ISO string)
 * @param compareDate - Date to compare against (ISO string)
 * @returns True if date is before compareDate
 */
export function isDateBefore(
  date: string | null | undefined,
  compareDate: string | null | undefined
): boolean {
  const d = parseDate(date);
  const cd = parseDate(compareDate);

  if (!d || !cd) {
    return false;
  }

  return isBefore(d, cd);
}

/**
 * Get start of day for a given ISO date
 * @param isoDate - ISO date string
 * @returns Date object set to start of day
 */
export function getStartOfDay(isoDate: string): Date {
  const date = parseISO(isoDate);
  return startOfDay(date);
}

/**
 * Get end of day for a given ISO date
 * @param isoDate - ISO date string
 * @returns Date object set to end of day
 */
export function getEndOfDay(isoDate: string): Date {
  const date = parseISO(isoDate);
  return endOfDay(date);
}

/**
 * Convert a JavaScript Date to ISO string (for API requests)
 * @param date - JavaScript Date object
 * @returns ISO date string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Get current date as ISO string (without time)
 * @returns ISO date string (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Get date range for the last N days
 * @param days - Number of days to go back
 * @returns Object with from and to dates as ISO strings
 */
export function getLastDaysRange(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

/**
 * Format duration in days for display
 * @param days - Number of days
 * @returns Formatted duration string
 */
export function formatDuration(days: number): string {
  if (days === 0) {
    return 'Mismo día';
  }
  if (days === 1) {
    return '1 día';
  }
  if (days < 0) {
    return `${Math.abs(days)} días (atrasado)`;
  }
  return `${days} días`;
}

/**
 * Get relative time description (e.g., "hace 2 días", "en 3 días")
 * @param isoDate - ISO date string to compare with now
 * @returns Relative time string
 */
export function getRelativeTime(isoDate: string | null | undefined): string {
  const date = parseDate(isoDate);
  if (!date) {
    return '-';
  }

  const now = new Date();
  const days = differenceInDays(date, now);

  if (days === 0) {
    return 'Hoy';
  }
  if (days === 1) {
    return 'Mañana';
  }
  if (days === -1) {
    return 'Ayer';
  }
  if (days > 0) {
    return `En ${days} días`;
  }
  return `Hace ${Math.abs(days)} días`;
}

/**
 * Format a date for API query parameters
 * @param date - Date object or ISO string
 * @returns Date string in YYYY-MM-DD format
 */
export function toAPIDateFormat(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Validate that a date string is a valid ISO date
 * @param dateStr - Date string to validate
 * @returns True if valid ISO date
 */
export function isValidISODate(dateStr: string | null | undefined): boolean {
  if (!dateStr) {
    return false;
  }
  try {
    const date = parseISO(dateStr);
    return isValid(date);
  } catch {
    return false;
  }
}

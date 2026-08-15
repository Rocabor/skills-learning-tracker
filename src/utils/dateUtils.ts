/**
 * Formats a duration in minutes into a human-readable string.
 * e.g. 45 -> "45m", 60 -> "1h", 90 -> "1h 30m", 150 -> "2h 30m"
 */
export function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hrs > 0 && mins > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (hrs > 0) {
    return `${hrs}h`;
  }
  return `${mins}m`;
}

/**
 * Formats minutes as total hours decimal (e.g. 75m -> 1.3h or 47.5h)
 */
export function formatHoursDecimal(minutes: number, decimals: number = 1): string {
  const hours = (minutes || 0) / 60;
  if (hours % 1 === 0) {
    return `${hours}h`;
  }
  return `${hours.toFixed(decimals)}h`;
}

/**
 * Flexible duration string parser.
 * Accepts: "45", "45m", "1h 30m", "1.5h", "1.5", "2h", "90 min"
 * Returns duration in minutes or null if invalid.
 */
export function parseFlexibleDuration(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();

  // Pure number check (e.g. "45", "90") -> interpreted as minutes
  if (/^\d+$/.test(trimmed)) {
    const val = parseInt(trimmed, 10);
    return val > 0 ? val : null;
  }

  // Decimal number alone e.g. "1.5" -> treat as 1.5 hours = 90 mins
  if (/^\d+\.\d+$/.test(trimmed)) {
    const val = parseFloat(trimmed);
    return Math.round(val * 60);
  }

  // "1h 30m" or "1h30m" or "1h 30min"
  const comboMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?$/);
  if (comboMatch) {
    const hours = parseFloat(comboMatch[1]);
    const mins = comboMatch[2] ? parseInt(comboMatch[2], 10) : 0;
    return Math.round(hours * 60) + mins;
  }

  // "45m" or "45 min" or "45mins"
  const minMatch = trimmed.match(/^(\d+)\s*m(?:in(?:utes?)?)?$/);
  if (minMatch) {
    return parseInt(minMatch[1], 10);
  }

  // "2.5h" or "2h"
  const hrMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (hrMatch) {
    return Math.round(parseFloat(hrMatch[1]) * 60);
  }

  return null;
}

/**
 * Returns today's date in local 'YYYY-MM-DD'
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format relative date: "Today", "Yesterday", or "Mar 19"
 */
export function formatRelativeDate(dateStr: string): string {
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';

  const d = new Date(`${dateStr}T00:00:00`);
  const t = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((t.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Full formatted date: "Friday, March 19, 2026"
 */
export function formatFullDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Gets the start of the week (Monday) for a given date in YYYY-MM-DD
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD dates (d2 - d1)
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(`${date1}T00:00:00Z`).getTime();
  const d2 = new Date(`${date2}T00:00:00Z`).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

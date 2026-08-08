/**
 * Date helpers shared across services. All dates are handled as JS Date
 * objects normalized to midnight in the script's time zone.
 */

function startOfDay_(date) {
  var d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays_(date, days) {
  var d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return startOfDay_(d);
}

/**
 * Adds calendar months (not a fixed day count) to a date, clamping to the
 * last day of the target month if the original day-of-month overflows it
 * (e.g. Jan 31 + 1 month -> Feb 28/29, not Mar 3).
 */
function addMonths_(date, months) {
  var year = date.getFullYear();
  var month = date.getMonth() + months;
  var day = date.getDate();
  var candidate = new Date(year, month, day);
  if (candidate.getMonth() !== ((month % 12) + 12) % 12) {
    candidate = new Date(year, month + 1, 0);
  }
  return startOfDay_(candidate);
}

function daysBetween_(from, to) {
  var msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay_(to).getTime() - startOfDay_(from).getTime()) / msPerDay);
}

function toIsoDateString_(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Normalizes a spreadsheet cell value into a Date, or null if it can't be
 * parsed. Accepts native Date values (from date-formatted cells) as well
 * as plain strings like "2026-03-31" or "2026/3/31".
 */
function normalizeDate_(value) {
  if (!value && value !== 0) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return startOfDay_(value);
  }
  if (typeof value === 'string') {
    var trimmed = value.trim();
    if (!trimmed) return null;
    var normalized = trimmed.replace(/年|月/g, '/').replace(/日/g, '').replace(/-/g, '/');
    var parsed = new Date(normalized);
    if (!isNaN(parsed.getTime())) return startOfDay_(parsed);
  }
  return null;
}

/**
 * Given a recurring fiscal year-end expressed as month/day, returns the
 * concrete date for that occurrence in a specific calendar year, clamping
 * to the last day of the month if the day overflows it (e.g. Feb 30).
 */
function fiscalDateInYear_(month, day, year) {
  var candidate = new Date(year, month - 1, day);
  if (candidate.getMonth() !== month - 1) {
    candidate = new Date(year, month, 0);
  }
  return startOfDay_(candidate);
}

/**
 * Parses a month-picker value ("yyyy-MM") into the first day of that
 * month; falls back to the current month if missing/malformed.
 */
function normalizeMonth_(value) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    var parts = value.split('-');
    return startOfDay_(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1));
  }
  var today = startOfDay_(new Date());
  return startOfDay_(new Date(today.getFullYear(), today.getMonth(), 1));
}

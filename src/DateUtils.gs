/**
 * Date helpers shared across services. All dates are handled as JS Date
 * objects normalized to midnight in the script's time zone.
 */

function startOfDay_(date) {
  var d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
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
 * A spreadsheet cell's date value is computed from the SPREADSHEET's own
 * timezone setting (File > Settings), which can silently differ from the
 * script's (appsscript.json's "timeZone"). Writing a midnight instant is
 * then only one timezone-offset hour away from spilling into the
 * previous calendar day once Sheets re-renders it - e.g. Aug 1 00:00
 * JST displays as "July 31" in a spreadsheet set to a more western zone.
 * Using noon instead gives a much wider safety margin for date-only
 * values that get written to a cell purely for display (a targetMonth or
 * 決算期), without changing what day/month it represents. Never use this
 * for a value only ever compared in-script (see monthKey_, which
 * deliberately avoids depending on time-of-day for this same reason).
 */
function asSheetDate_(date) {
  var d = new Date(date.getTime());
  d.setHours(12, 0, 0, 0);
  return d;
}

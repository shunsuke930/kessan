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
 * Given a recurring fiscal year-end expressed as month/day, finds the
 * occurrence whose filing window (fiscalDate + FILING_DEADLINE_OFFSET_DAYS)
 * is the soonest one that has not already fully closed, relative to
 * `today`. This keeps a case visible while it's still in its post
 * year-end filing window, and rolls forward to next year's date once the
 * filing deadline has passed.
 */
function nextFiscalYearEnd_(month, day, today) {
  var candidates = [];
  for (var yearOffset = -1; yearOffset <= 1; yearOffset++) {
    var year = today.getFullYear() + yearOffset;
    var candidate = new Date(year, month - 1, day);
    if (candidate.getMonth() !== month - 1) {
      // day overflowed (e.g. Feb 30) - clamp to last day of month.
      candidate = new Date(year, month, 0);
    }
    candidates.push(startOfDay_(candidate));
  }
  candidates.sort(function (a, b) { return a.getTime() - b.getTime(); });

  for (var i = 0; i < candidates.length; i++) {
    var deadline = addDays_(candidates[i], CONFIG.FILING_DEADLINE_OFFSET_DAYS);
    if (deadline.getTime() >= today.getTime()) {
      return candidates[i];
    }
  }
  return candidates[candidates.length - 1];
}

/**
 * Annual calendar view: a Jan-Dec overview showing, for every customer,
 * a 準備期間 (2 calendar months up to and including 決算日) and a
 * 決算期間 (the 2 calendar months right after 決算日), plus a handful of
 * generic recurring compliance milestones for orientation.
 */

function fiscalYearEndInYear_(month, day, year) {
  var candidate = new Date(year, month - 1, day);
  if (candidate.getMonth() !== month - 1) {
    candidate = new Date(year, month, 0); // day overflowed - clamp to last day of month.
  }
  return startOfDay_(candidate);
}

function clampToRange_(date, rangeStart, rangeEnd) {
  if (date.getTime() < rangeStart.getTime()) return rangeStart;
  if (date.getTime() > rangeEnd.getTime()) return rangeEnd;
  return date;
}

/**
 * Returns { year, milestones, rows } for the requested calendar year.
 * `rows` holds two bands per customer (準備期間 / 決算期間), each clamped
 * to the requested year so the chart never scrolls outside Jan 1 - Dec 31.
 * `milestones` covers this year and the next one, so upcoming milestones
 * (e.g. 確定申告 in Jan-Mar) stay visible without switching 対象年 -
 * independent of the reference date used elsewhere on the dashboard.
 */
function getAnnualCalendarData(yearInput) {
  var year = parseInt(yearInput, 10) || new Date().getFullYear();
  var yearStart = startOfDay_(new Date(year, 0, 1));
  var yearEnd = startOfDay_(new Date(year, 11, 31));

  var milestones = [];
  [year, year + 1].forEach(function (milestoneYear) {
    ANNUAL_MILESTONES.forEach(function (m) {
      milestones.push({
        id: 'milestone_' + m.key + '_' + milestoneYear,
        type: 'milestone',
        name: m.name + (milestoneYear !== year ? '（' + milestoneYear + '年）' : ''),
        start: toIsoDateString_(startOfDay_(new Date(milestoneYear, m.startMonth - 1, m.startDay))),
        end: toIsoDateString_(startOfDay_(new Date(milestoneYear, m.endMonth - 1, m.endDay)))
      });
    });
  });

  var customers = getCustomers();
  var rows = [];

  customers.forEach(function (customer) {
    var fiscalEnd = fiscalYearEndInYear_(customer.fiscalMonth, customer.fiscalDay, year);

    var prepStart = clampToRange_(startOfDay_(new Date(fiscalEnd.getFullYear(), fiscalEnd.getMonth() - 1, 1)), yearStart, yearEnd);
    var prepEnd = clampToRange_(fiscalEnd, yearStart, yearEnd);
    var settlementStart = clampToRange_(addDays_(fiscalEnd, 1), yearStart, yearEnd);
    var settlementEnd = clampToRange_(startOfDay_(new Date(fiscalEnd.getFullYear(), fiscalEnd.getMonth() + 3, 0)), yearStart, yearEnd);

    if (prepStart.getTime() <= prepEnd.getTime()) {
      rows.push({
        id: 'prep_' + customer.id,
        type: 'prep',
        customerId: customer.id,
        customerName: customer.customerName,
        name: customer.customerName + '（準備期間）',
        start: toIsoDateString_(prepStart),
        end: toIsoDateString_(prepEnd)
      });
    }
    if (settlementStart.getTime() <= settlementEnd.getTime()) {
      rows.push({
        id: 'settlement_' + customer.id,
        type: 'settlement',
        customerId: customer.id,
        customerName: customer.customerName,
        name: customer.customerName + '（決算期間）',
        start: toIsoDateString_(settlementStart),
        end: toIsoDateString_(settlementEnd)
      });
    }
  });

  return {
    year: year,
    milestones: milestones,
    rows: rows
  };
}

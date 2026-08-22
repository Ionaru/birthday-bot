/**
 * Turning the /add-birthday options into a stored date, and dates back into text.
 *
 * Replaces moment. `format('MMMM Do')` becomes Intl, which already knows both the
 * month names and the English ordinal rules.
 */
import { isIsoDate, isLeapYear, padNumber } from '@birthday-bot/common';

const ORDINAL_RULES = new Intl.PluralRules('en-US', { type: 'ordinal' });
const ORDINAL_SUFFIXES = new Map([
    ['few', 'rd'],
    ['one', 'st'],
    ['other', 'th'],
    ['two', 'nd'],
]);
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' });

export const ordinal = (value: number): string =>
    `${value}${ORDINAL_SUFFIXES.get(ORDINAL_RULES.select(value)) ?? 'th'}`;

/** `2026-08-22` becomes `August 22nd`. The year is deliberately not shown. */
export const formatMonthDay = (isoDate: string): string => {
    const [, month, day] = isoDate.split('-').map(Number);
    return `${MONTH_FORMAT.format(Date.UTC(2000, month - 1, 1))} ${ordinal(day)}`;
};

/**
 * The year to file a birthday under when the user did not give one.
 *
 * The old version tested `month <= currentMonth && day <= currentDay`, which is not
 * a date comparison: on 22 August a 30 March birthday failed the day half and was
 * filed under the current year, a date already four months in the past. Comparing
 * the month and day together as one number fixes that.
 */
export const nextYearFor = (day: number, month: number, today: Date): number => {
    const year = today.getUTCFullYear();
    const todayKey = (today.getUTCMonth() + 1) * 100 + today.getUTCDate();
    return month * 100 + day < todayKey ? year + 1 : year;
};

/**
 * Builds the stored `YYYY-MM-DD`, or undefined when the options are not a real date.
 *
 * With no year given, a 29 February birthday is filed under the next leap year;
 * anything else would be rejected as a non-existent date and the command would fail
 * for a perfectly valid birthday.
 */
export const buildBirthdayDate = (
    day: number,
    month: number,
    year: number | undefined,
    today: Date,
): string | undefined => {
    if (!Number.isInteger(day) || !Number.isInteger(month) || month < 1 || month > 12 || day < 1) {
        return undefined;
    }

    let resolvedYear = year ?? nextYearFor(day, month, today);
    if (year === undefined && month === 2 && day === 29) {
        while (!isLeapYear(resolvedYear)) {
            resolvedYear += 1;
        }
    }

    const isoDate = `${padNumber(resolvedYear, 4)}-${padNumber(month)}-${padNumber(day)}`;
    return isIsoDate(isoDate) ? isoDate : undefined;
};

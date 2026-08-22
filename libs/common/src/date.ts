/**
 * UTC date helpers shared by the calendar and discord-client services.
 *
 * Replaces moment and moment-timezone. Everything here works in UTC, which is what
 * the bot has always done: birthdays are stored as a plain `YYYY-MM-DD` with no zone,
 * and the daily notification fires at a fixed UTC hour.
 */

export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const isLeapYear = (year: number): boolean =>
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

export const startOfUtcDay = (date: Date): number =>
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

export const padNumber = (value: number, length = 2): string =>
    value.toString().padStart(length, '0');

/**
 * Deciding which notification, if any, a birthday is due for today.
 *
 * Replaces the moment arithmetic in SendBirthdayNotificationsTask, which pinned the
 * birthday to the *current* year and then walked backwards. That missed every
 * birthday whose warning window crossed New Year: on 28 December a 5 January
 * birthday was compared against 5 January of the year just ending, 357 days in the
 * past, so no notification ever fired for it. This looks at the next occurrence
 * instead, whichever year that falls in.
 */
import { DAY_IN_MS, isLeapYear, startOfUtcDay } from '@birthday-bot/common';
import { BIRTHDAY_NOTIFICATION_TYPE, type BirthdayNotificationType } from '@birthday-bot/interfaces';

/**
 * The birthday's date in a given year, as a UTC timestamp.
 *
 * A 29 February birthday is observed on the 28th in common years. Letting Date.UTC
 * normalise it would push the notification to 1 March, i.e. after the fact.
 */
export const occurrenceIn = (year: number, month: number, day: number): number => {
    const observedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
    return Date.UTC(year, month - 1, observedDay);
};

/** The next time this birthday comes round, counting today as "next". */
export const nextOccurrence = (birthday: string, today: Date): number => {
    const [, month, day] = birthday.split('-').map(Number);
    const start = startOfUtcDay(today);
    const thisYear = occurrenceIn(today.getUTCFullYear(), month, day);
    return thisYear >= start ? thisYear : occurrenceIn(today.getUTCFullYear() + 1, month, day);
};

export const daysUntilBirthday = (birthday: string, today: Date): number =>
    Math.round((nextOccurrence(birthday, today) - startOfUtcDay(today)) / DAY_IN_MS);

/** Undefined on every other day of the year, which is almost all of them. */
export const notificationTypeFor = (
    birthday: string,
    today: Date,
): BirthdayNotificationType | undefined => {
    switch (daysUntilBirthday(birthday, today)) {
        case 0:
            return BIRTHDAY_NOTIFICATION_TYPE.TODAY;
        case 1:
            return BIRTHDAY_NOTIFICATION_TYPE.DAY;
        case 7:
            return BIRTHDAY_NOTIFICATION_TYPE.WEEK;
        case 14:
            return BIRTHDAY_NOTIFICATION_TYPE.FORTNIGHT;
        default:
            return undefined;
    }
};

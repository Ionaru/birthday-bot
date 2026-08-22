/**
 * Shapes shared by all four services.
 *
 * `BirthdayNotificationType` used to be a TypeScript enum. Enums are not erasable
 * syntax, so Node cannot strip them and `erasableSyntaxOnly` rejects them; it is a
 * frozen object plus a union type instead. The numeric values are unchanged, so
 * anything already on the wire keeps its meaning.
 */

export interface IBirthday {
    /** ISO date, `YYYY-MM-DD`. Only the month and day are meaningful. */
    birthday: string;
    channel: string;
    createdOn: string;
    deletedOn: string | null;
    id: string;
    updatedOn: string;
    user: string;
}

export interface INotification {
    id: string;
    notificationType: BirthdayNotificationType;
}

/** Values start at 1 so that a missing type stays falsy. */
export const BIRTHDAY_NOTIFICATION_TYPE = {
    DAY: 2,
    FORTNIGHT: 4,
    TODAY: 1,
    WEEK: 3,
} as const;

export type BirthdayNotificationType =
    (typeof BIRTHDAY_NOTIFICATION_TYPE)[keyof typeof BIRTHDAY_NOTIFICATION_TYPE];

export const isBirthdayNotificationType = (value: unknown): value is BirthdayNotificationType =>
    Object.values(BIRTHDAY_NOTIFICATION_TYPE).includes(value as BirthdayNotificationType);

/**
 * An error whose message is safe to show to a Discord user. Commands report these
 * and stop; anything else is rethrown so it reaches the process error handlers.
 */
export class HandledError extends Error {}

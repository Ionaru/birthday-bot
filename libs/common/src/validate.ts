/**
 * Request validation.
 *
 * Replaces the Ajv schemas in the storage and discord-client routes. Three shapes
 * are validated in total, so a schema compiler and its 200kB of dependencies were
 * doing very little work.
 */
import { type BirthdayNotificationType, isBirthdayNotificationType } from '@birthday-bot/interfaces';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
/** A Discord snowflake pair, `user:channel`, as used by DELETE /:id. */
const BIRTHDAY_IDENTIFIER = /^\d+:\d+$/;
const SNOWFLAKE = /^\d+$/;

/**
 * True only for a real calendar date. The round-trip rejects 2026-02-30, which the
 * regex alone accepts and SQLite would happily store.
 */
export const isIsoDate = (value: unknown): value is string => {
    if (typeof value !== 'string' || !ISO_DATE.test(value)) {
        return false;
    }
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

export const isUuid = (value: unknown): value is string =>
    typeof value === 'string' && UUID.test(value);

export const isBirthdayIdentifier = (value: unknown): value is string =>
    typeof value === 'string' && BIRTHDAY_IDENTIFIER.test(value);

export const isSnowflake = (value: unknown): value is string =>
    typeof value === 'string' && SNOWFLAKE.test(value);

export interface BirthdayInput {
    birthday: string;
    channel: string;
    user: string;
}

/** Returns the reason it failed, or undefined when the body is valid. */
export const validateBirthdayInput = (body: unknown): string | undefined => {
    if (typeof body !== 'object' || body === null) {
        return 'Body must be an object';
    }
    const { birthday, channel, user } = body as Record<string, unknown>;
    if (!isSnowflake(user)) {
        return 'user must be a Discord ID';
    }
    if (!isSnowflake(channel)) {
        return 'channel must be a Discord ID';
    }
    if (!isIsoDate(birthday)) {
        return 'birthday must be a YYYY-MM-DD date';
    }
    return undefined;
};

export interface NotificationInput {
    id: string;
    notificationType: BirthdayNotificationType;
}

export const validateNotificationInput = (body: unknown): string | undefined => {
    if (typeof body !== 'object' || body === null) {
        return 'Body must be an object';
    }
    const { id, notificationType } = body as Record<string, unknown>;
    if (!isUuid(id)) {
        return 'id must be a UUID';
    }
    if (!isBirthdayNotificationType(notificationType)) {
        return 'notificationType is not a known notification type';
    }
    return undefined;
};

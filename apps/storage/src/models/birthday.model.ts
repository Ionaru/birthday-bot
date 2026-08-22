/**
 * The birthday table, as a repository of prepared statements.
 *
 * Replaces the TypeORM active-record entity (`Birthday extends BaseModel`) and the
 * BirthdayService that wrapped it.
 */
import { randomUUID } from 'node:crypto';

import { type IBirthday } from '@birthday-bot/interfaces';

import { getDatabase } from '../database/connection.ts';

const COLUMNS = '"id", "createdOn", "updatedOn", "deletedOn", "user", "channel", "birthday"';

/**
 * node:sqlite hands back whatever the column's affinity produced, which for these
 * `varchar` and `datetime` columns is a string but is not typed as one. Coerce
 * narrowly rather than through String(), which would happily stringify a Buffer.
 */
const asText = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
        return value.toString();
    }
    return '';
};

const toBirthday = (row: Record<string, unknown>): IBirthday => ({
    birthday: asText(row['birthday']),
    channel: asText(row['channel']),
    createdOn: asText(row['createdOn']),
    deletedOn: row['deletedOn'] == null ? null : asText(row['deletedOn']),
    id: asText(row['id']),
    updatedOn: asText(row['updatedOn']),
    user: asText(row['user']),
});

/**
 * Orders by month and day, ignoring the year.
 *
 * The stored date carries a year, but it is never the year of birth in any useful
 * sense (see the discord-client's date builder), so ordering on the full string
 * would interleave the list arbitrarily.
 */
export const compareByDayOfYear = (left: IBirthday, right: IBirthday): number =>
    left.birthday.slice(5).localeCompare(right.birthday.slice(5));

export const birthdayRepository = {

    deleteById: (id: string): void => {
        getDatabase().prepare('DELETE FROM "birthday" WHERE "id" = ?').run(id);
    },

    findAll: (): IBirthday[] => {
        const rows = getDatabase().prepare(`SELECT ${COLUMNS} FROM "birthday"`).all();
        return rows.map((row) => toBirthday(row));
    },

    findById: (id: string): IBirthday | undefined => {
        const row = getDatabase().prepare(`SELECT ${COLUMNS} FROM "birthday" WHERE "id" = ?`).get(id);
        return row ? toBirthday(row) : undefined;
    },

    findByUserAndChannel: (user: string, channel: string): IBirthday | undefined => {
        const row = getDatabase()
            .prepare(`SELECT ${COLUMNS} FROM "birthday" WHERE "user" = ? AND "channel" = ?`)
            .get(user, channel);
        return row ? toBirthday(row) : undefined;
    },

    insert: (user: string, channel: string, birthday: string): IBirthday => {
        const id = randomUUID();
        getDatabase()
            .prepare('INSERT INTO "birthday" ("id", "user", "channel", "birthday") VALUES (?, ?, ?, ?)')
            .run(id, user, channel, birthday);
        // Read back so createdOn and updatedOn are the values SQLite defaulted to.
        return birthdayRepository.findById(id) as IBirthday;
    },

    sorted: (): IBirthday[] => birthdayRepository.findAll().sort(compareByDayOfYear),
};

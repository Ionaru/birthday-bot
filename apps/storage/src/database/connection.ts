import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

/**
 * The final schema, previously produced by the single TypeORM migration
 * (1615834291131-Initial). `CREATE TABLE IF NOT EXISTS` makes this a no-op against
 * an already-migrated birthday.db and creates the schema from scratch on a fresh
 * one, so an existing production database opens untouched.
 *
 * The column types and the constraint name are copied verbatim from that migration.
 * `deletedOn` is kept purely for that compatibility: nothing soft-deletes any more,
 * and dropping a column in SQLite means rebuilding the table.
 */
const schema = `
    CREATE TABLE IF NOT EXISTS "birthday" (
        "id"        varchar PRIMARY KEY NOT NULL,
        "createdOn" datetime            NOT NULL DEFAULT (datetime('now')),
        "updatedOn" datetime            NOT NULL DEFAULT (datetime('now')),
        "deletedOn" datetime,
        "user"      varchar             NOT NULL,
        "channel"   varchar             NOT NULL,
        "birthday"  varchar             NOT NULL,
        CONSTRAINT "UQ_78396a99fe013dab3be0c6670cd" UNIQUE ("user", "channel")
    );
`;

let database: DatabaseSync | undefined;

export const initDatabase = (path = 'data/birthday.db'): DatabaseSync => {
    // node:sqlite will not create missing parent directories, so ensure they exist.
    if (path !== ':memory:') {
        mkdirSync(dirname(path), { recursive: true });
    }
    database = new DatabaseSync(path);
    database.exec(schema);
    return database;
};

export const getDatabase = (): DatabaseSync => {
    if (!database) {
        throw new Error('Database has not been initialized, call initDatabase() first.');
    }
    return database;
};

export const closeDatabase = (): void => {
    database?.close();
    database = undefined;
};

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { closeDatabase, initDatabase } from '../database/connection.ts';

import { birthdayRepository, compareByDayOfYear } from './birthday.model.ts';

describe('the birthday repository', () => {
    beforeEach(() => {
        initDatabase(':memory:');
    });

    afterEach(() => {
        closeDatabase();
    });

    it('starts empty', () => {
        assert.deepEqual(birthdayRepository.findAll(), []);
    });

    it('round-trips an inserted birthday', () => {
        const created = birthdayRepository.insert('123', '456', '2026-08-22');

        assert.equal(created.user, '123');
        assert.equal(created.channel, '456');
        assert.equal(created.birthday, '2026-08-22');
        assert.equal(created.deletedOn, null);
        // The id is generated here, and the timestamps are SQLite's defaults.
        assert.match(created.id, /^[\da-f-]{36}$/);
        assert.notEqual(created.createdOn, '');
        assert.notEqual(created.updatedOn, '');

        assert.deepEqual(birthdayRepository.findById(created.id), created);
        assert.deepEqual(birthdayRepository.findByUserAndChannel('123', '456'), created);
    });

    it('rejects a second birthday for the same user and channel', () => {
        birthdayRepository.insert('123', '456', '2026-08-22');
        assert.throws(() => birthdayRepository.insert('123', '456', '2026-01-01'), /UNIQUE/i);
    });

    it('allows the same user in a different channel', () => {
        birthdayRepository.insert('123', '456', '2026-08-22');
        birthdayRepository.insert('123', '789', '2026-08-22');
        assert.equal(birthdayRepository.findAll().length, 2);
    });

    it('deletes by id', () => {
        const created = birthdayRepository.insert('123', '456', '2026-08-22');
        birthdayRepository.deleteById(created.id);
        assert.equal(birthdayRepository.findById(created.id), undefined);
        assert.deepEqual(birthdayRepository.findAll(), []);
    });

    it('returns undefined rather than throwing for a missing row', () => {
        assert.equal(birthdayRepository.findById('nope'), undefined);
        assert.equal(birthdayRepository.findByUserAndChannel('1', '2'), undefined);
    });

    it('sorts by month and day, ignoring the stored year', () => {
        birthdayRepository.insert('1', '10', '2020-12-31');
        birthdayRepository.insert('2', '10', '2027-01-01');
        birthdayRepository.insert('3', '10', '2026-06-15');

        assert.deepEqual(
            birthdayRepository.sorted().map((birthday) => birthday.birthday),
            ['2027-01-01', '2026-06-15', '2020-12-31'],
        );
    });
});

describe('compareByDayOfYear', () => {
    const of = (birthday: string) => ({ birthday }) as Parameters<typeof compareByDayOfYear>[0];

    it('orders within a year', () => {
        assert.ok(compareByDayOfYear(of('2026-01-05'), of('2026-11-02')) < 0);
        assert.ok(compareByDayOfYear(of('2026-11-02'), of('2026-01-05')) > 0);
    });

    it('treats the same day in different years as equal', () => {
        assert.equal(compareByDayOfYear(of('2020-03-04'), of('2030-03-04')), 0);
    });
});

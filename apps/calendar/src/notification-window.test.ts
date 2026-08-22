import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BIRTHDAY_NOTIFICATION_TYPE } from '@birthday-bot/interfaces';

import { daysUntilBirthday, notificationTypeFor, occurrenceIn } from './notification-window.ts';

const on = (isoDate: string) => new Date(`${isoDate}T18:00:00.000Z`);

describe('notificationTypeFor', () => {
    it('fires on the day itself', () => {
        assert.equal(notificationTypeFor('1990-08-22', on('2026-08-22')), BIRTHDAY_NOTIFICATION_TYPE.TODAY);
    });

    it('fires the day before', () => {
        assert.equal(notificationTypeFor('1990-08-22', on('2026-08-21')), BIRTHDAY_NOTIFICATION_TYPE.DAY);
    });

    it('fires a week before', () => {
        assert.equal(notificationTypeFor('1990-08-22', on('2026-08-15')), BIRTHDAY_NOTIFICATION_TYPE.WEEK);
    });

    it('fires a fortnight before', () => {
        assert.equal(notificationTypeFor('1990-08-22', on('2026-08-08')), BIRTHDAY_NOTIFICATION_TYPE.FORTNIGHT);
    });

    it('stays quiet on every other day', () => {
        for (const day of ['2026-08-07', '2026-08-09', '2026-08-14', '2026-08-16', '2026-08-20', '2026-08-23']) {
            assert.equal(notificationTypeFor('1990-08-22', on(day)), undefined, `should be quiet on ${day}`);
        }
    });

    it('is unaffected by the year stored on the birthday', () => {
        for (const stored of ['1990-08-22', '2026-08-22', '2031-08-22']) {
            assert.equal(notificationTypeFor(stored, on('2026-08-22')), BIRTHDAY_NOTIFICATION_TYPE.TODAY);
        }
    });

    describe('across New Year', () => {
        // The moment-based original pinned the birthday to the current year, so a
        // 5 January birthday was compared against a date 357 days in the past and
        // never notified from December.
        it('warns a fortnight ahead from December', () => {
            assert.equal(
                notificationTypeFor('1990-01-05', on('2025-12-22')),
                BIRTHDAY_NOTIFICATION_TYPE.FORTNIGHT,
            );
        });

        it('warns a week ahead from December', () => {
            assert.equal(notificationTypeFor('1990-01-05', on('2025-12-29')), BIRTHDAY_NOTIFICATION_TYPE.WEEK);
        });

        it('warns the day before, across the boundary', () => {
            assert.equal(notificationTypeFor('1990-01-01', on('2025-12-31')), BIRTHDAY_NOTIFICATION_TYPE.DAY);
        });
    });

    describe('29 February', () => {
        it('fires on the 29th in a leap year', () => {
            assert.equal(notificationTypeFor('2000-02-29', on('2028-02-29')), BIRTHDAY_NOTIFICATION_TYPE.TODAY);
        });

        it('is observed on the 28th in a common year', () => {
            assert.equal(notificationTypeFor('2000-02-29', on('2026-02-28')), BIRTHDAY_NOTIFICATION_TYPE.TODAY);
            // Not on 1 March, which is where Date.UTC would have normalised it.
            assert.equal(notificationTypeFor('2000-02-29', on('2026-03-01')), undefined);
        });
    });
});

describe('daysUntilBirthday', () => {
    it('counts to the next occurrence, not the last', () => {
        assert.equal(daysUntilBirthday('1990-08-22', on('2026-08-23')), 364);
        assert.equal(daysUntilBirthday('1990-08-22', on('2026-08-22')), 0);
    });
});

describe('occurrenceIn', () => {
    it('leaves ordinary dates alone', () => {
        assert.equal(occurrenceIn(2026, 8, 22), Date.UTC(2026, 7, 22));
    });

    it('moves 29 February back to the 28th in a common year', () => {
        assert.equal(occurrenceIn(2026, 2, 29), Date.UTC(2026, 1, 28));
        assert.equal(occurrenceIn(2028, 2, 29), Date.UTC(2028, 1, 29));
    });
});

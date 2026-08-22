import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildBirthdayDate, formatMonthDay, nextYearFor, ordinal } from './date.ts';

const on = (isoDate: string) => new Date(`${isoDate}T12:00:00.000Z`);

describe('ordinal', () => {
    it('uses the English suffixes', () => {
        assert.equal(ordinal(1), '1st');
        assert.equal(ordinal(2), '2nd');
        assert.equal(ordinal(3), '3rd');
        assert.equal(ordinal(4), '4th');
        assert.equal(ordinal(11), '11th');
        assert.equal(ordinal(12), '12th');
        assert.equal(ordinal(13), '13th');
        assert.equal(ordinal(21), '21st');
        assert.equal(ordinal(22), '22nd');
        assert.equal(ordinal(23), '23rd');
        assert.equal(ordinal(31), '31st');
    });
});

describe('formatMonthDay', () => {
    it('matches the moment "MMMM Do" output it replaces', () => {
        assert.equal(formatMonthDay('2026-08-22'), 'August 22nd');
        assert.equal(formatMonthDay('1990-01-01'), 'January 1st');
        assert.equal(formatMonthDay('2024-02-29'), 'February 29th');
        assert.equal(formatMonthDay('2026-12-03'), 'December 3rd');
    });

    it('does not leak the stored year', () => {
        assert.equal(formatMonthDay('1975-06-15'), formatMonthDay('2031-06-15'));
    });
});

describe('nextYearFor', () => {
    const today = on('2026-08-22');

    it('keeps this year for a date still to come', () => {
        assert.equal(nextYearFor(23, 8, today), 2026);
        assert.equal(nextYearFor(1, 12, today), 2026);
    });

    it('keeps this year for today itself', () => {
        assert.equal(nextYearFor(22, 8, today), 2026);
    });

    it('rolls to next year for a date already past', () => {
        assert.equal(nextYearFor(21, 8, today), 2027);
        assert.equal(nextYearFor(1, 1, today), 2027);
    });

    it('compares the whole date, not the month and day separately', () => {
        // The original tested `month <= currentMonth && day <= currentDay`, so 30 March
        // failed on the day and was filed under 2026, four months in the past.
        assert.equal(nextYearFor(30, 3, today), 2027);
    });
});

describe('buildBirthdayDate', () => {
    const today = on('2026-08-22');

    it('uses an explicit year as given', () => {
        assert.equal(buildBirthdayDate(22, 8, 1990, today), '1990-08-22');
    });

    it('pads the month and day', () => {
        assert.equal(buildBirthdayDate(1, 2, 1990, today), '1990-02-01');
    });

    it('picks the next occurrence when no year is given', () => {
        assert.equal(buildBirthdayDate(23, 8, undefined, today), '2026-08-23');
        assert.equal(buildBirthdayDate(30, 3, undefined, today), '2027-03-30');
    });

    it('files a 29 February birthday under the next leap year', () => {
        // 2027-02-29 does not exist, so the naive next-year choice would be rejected
        // and the command would refuse a perfectly valid birthday.
        assert.equal(buildBirthdayDate(29, 2, undefined, today), '2028-02-29');
    });

    it('still rejects an explicit 29 February in a common year', () => {
        assert.equal(buildBirthdayDate(29, 2, 2026, today), undefined);
    });

    it('rejects impossible dates', () => {
        assert.equal(buildBirthdayDate(31, 4, 1990, today), undefined);
        assert.equal(buildBirthdayDate(0, 8, 1990, today), undefined);
        assert.equal(buildBirthdayDate(32, 8, 1990, today), undefined);
        assert.equal(buildBirthdayDate(22, 13, 1990, today), undefined);
        assert.equal(buildBirthdayDate(22, 0, 1990, today), undefined);
        assert.equal(buildBirthdayDate(1.5, 8, 1990, today), undefined);
    });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isBirthdayIdentifier, isIsoDate, isSnowflake, isUuid,
    validateBirthdayInput, validateNotificationInput } from './validate.ts';

describe('isIsoDate', () => {
    it('accepts a real date', () => {
        assert.equal(isIsoDate('2026-08-22'), true);
    });

    it('accepts 29 February in a leap year', () => {
        assert.equal(isIsoDate('2024-02-29'), true);
    });

    it('rejects 29 February in a common year', () => {
        assert.equal(isIsoDate('2026-02-29'), false);
    });

    it('rejects a day that does not exist in the month', () => {
        assert.equal(isIsoDate('2026-04-31'), false);
    });

    it('rejects the wrong shape', () => {
        for (const value of ['2026-8-22', '22-08-2026', '2026/08/22', '', 'today', 20_260_822]) {
            assert.equal(isIsoDate(value), false, `${String(value)} should be rejected`);
        }
    });
});

describe('identifier checks', () => {
    it('recognises a UUID', () => {
        assert.equal(isUuid('9f1a2b3c-4d5e-4f60-8a9b-0c1d2e3f4a5b'), true);
        assert.equal(isUuid('not-a-uuid'), false);
    });

    it('recognises a user:channel pair', () => {
        assert.equal(isBirthdayIdentifier('123:456'), true);
        assert.equal(isBirthdayIdentifier('123'), false);
        assert.equal(isBirthdayIdentifier('abc:def'), false);
    });

    it('recognises a snowflake', () => {
        assert.equal(isSnowflake('302011421523443713'), true);
        assert.equal(isSnowflake('<@302011421523443713>'), false);
    });
});

describe('validateBirthdayInput', () => {
    const valid = { birthday: '2026-08-22', channel: '456', user: '123' };

    it('accepts a complete body', () => {
        assert.equal(validateBirthdayInput(valid), undefined);
    });

    it('names the offending field', () => {
        assert.match(validateBirthdayInput({ ...valid, user: 'nope' }) ?? '', /user/);
        assert.match(validateBirthdayInput({ ...valid, channel: 'nope' }) ?? '', /channel/);
        assert.match(validateBirthdayInput({ ...valid, birthday: 'nope' }) ?? '', /birthday/);
    });

    it('rejects a non-object', () => {
        assert.notEqual(validateBirthdayInput(null), undefined);
        assert.notEqual(validateBirthdayInput('string'), undefined);
    });
});

describe('validateNotificationInput', () => {
    const id = '9f1a2b3c-4d5e-4f60-8a9b-0c1d2e3f4a5b';

    it('accepts a known notification type', () => {
        assert.equal(validateNotificationInput({ id, notificationType: 1 }), undefined);
        assert.equal(validateNotificationInput({ id, notificationType: 4 }), undefined);
    });

    it('rejects a type outside the enum', () => {
        assert.notEqual(validateNotificationInput({ id, notificationType: 0 }), undefined);
        assert.notEqual(validateNotificationInput({ id, notificationType: 5 }), undefined);
    });

    it('rejects a bad id', () => {
        assert.match(validateNotificationInput({ id: '123', notificationType: 1 }) ?? '', /id/);
    });
});

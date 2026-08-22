import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BIRTHDAY_NOTIFICATION_TYPE } from '@birthday-bot/interfaces';

import { buildNotificationMessage } from './messages.ts';

describe('buildNotificationMessage', () => {
    it('shouts on the day itself', () => {
        assert.equal(
            buildNotificationMessage(BIRTHDAY_NOTIFICATION_TYPE.TODAY, 'Ionaru', '1990-08-22'),
            '@here\n**HAPPY BIRTHDAY IONARU!!!!!!!** 🎂🎈',
        );
    });

    it('announces the day before', () => {
        assert.equal(
            buildNotificationMessage(BIRTHDAY_NOTIFICATION_TYPE.DAY, 'Ionaru', '1990-08-22'),
            '@here\nTomorrow we celebrate the birthday of Ionaru!',
        );
    });

    it('announces a week ahead', () => {
        assert.equal(
            buildNotificationMessage(BIRTHDAY_NOTIFICATION_TYPE.WEEK, 'Ionaru', '1990-08-22'),
            '@here\nNext week we celebrate the birthday of Ionaru!',
        );
    });

    it('announces a fortnight ahead', () => {
        assert.equal(
            buildNotificationMessage(BIRTHDAY_NOTIFICATION_TYPE.FORTNIGHT, 'Ionaru', '1990-08-22'),
            '@here\nIn two weeks we celebrate the birthday of Ionaru!',
        );
    });

    it('falls back to the raw date for an unknown type', () => {
        assert.equal(
            buildNotificationMessage(99 as never, 'Ionaru', '1990-08-22'),
            '@here\nAt some point (1990-08-22) we celebrate the birthday of Ionaru!',
        );
    });

    it('pings @here every time', () => {
        for (const type of Object.values(BIRTHDAY_NOTIFICATION_TYPE)) {
            assert.ok(buildNotificationMessage(type, 'Ionaru', '1990-08-22').startsWith('@here\n'));
        }
    });
});

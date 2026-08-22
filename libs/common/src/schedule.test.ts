import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createDebug } from './debug.ts';
import { millisecondsUntilHourUtc, scheduleDaily } from './schedule.ts';

const HOUR = 60 * 60 * 1000;

describe('millisecondsUntilHourUtc', () => {
    it('counts forward within the same day', () => {
        const now = new Date('2026-08-22T06:00:00.000Z');
        assert.equal(millisecondsUntilHourUtc(18, now), 12 * HOUR);
    });

    it('rolls over to the next day once the hour has passed', () => {
        const now = new Date('2026-08-22T20:00:00.000Z');
        assert.equal(millisecondsUntilHourUtc(18, now), 22 * HOUR);
    });

    it('waits a full day when called exactly on the hour', () => {
        // Otherwise a tick that finishes instantly would reschedule itself into a loop.
        const now = new Date('2026-08-22T18:00:00.000Z');
        assert.equal(millisecondsUntilHourUtc(18, now), 24 * HOUR);
    });

    it('ignores the local timezone', () => {
        const now = new Date('2026-12-31T23:30:00.000Z');
        assert.equal(millisecondsUntilHourUtc(0, now), 30 * 60 * 1000);
    });
});

describe('scheduleDaily', () => {
    it('keeps the event loop alive until it is stopped', () => {
        // The calendar service has nothing else to wait on. An unref'd timer here let
        // the container exit 0 immediately and restart-loop under Compose.
        const task = scheduleDaily(18, () => undefined, createDebug('test'));
        assert.ok(process.getActiveResourcesInfo().includes('Timeout'));
        task.stop();
        assert.ok(!process.getActiveResourcesInfo().includes('Timeout'));
    });
});

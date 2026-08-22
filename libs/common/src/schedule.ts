/**
 * A once-a-day timer.
 *
 * Replaces the `cron` package, which was pulled in for a single `0 0 18 * * *`
 * entry. Each tick schedules the next one rather than using an interval, so a slow
 * tick cannot make the fire time drift.
 *
 * The pending timer is deliberately not unref'd: waiting for it is the only thing the
 * calendar service does, so an unref'd timer would let the process exit straight away
 * with status 0 and leave Compose restarting it forever. Call `stop()` to let a test
 * or a shutdown release the loop.
 */
import { type Debugger } from './debug.ts';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Milliseconds from `now` until the next `hourUtc:00:00.000` UTC.
 *
 * Exactly at the fire time this returns a whole day, not zero, so a tick cannot
 * immediately reschedule itself into a busy loop.
 */
export const millisecondsUntilHourUtc = (hourUtc: number, now: Date): number => {
    const next = new Date(now);
    next.setUTCHours(hourUtc, 0, 0, 0);
    const delay = next.getTime() - now.getTime();
    return delay > 0 ? delay : delay + DAY_IN_MS;
};

export interface ScheduledTask {
    stop: () => void;
}

export const scheduleDaily = (hourUtc: number, task: () => Promise<void> | void, log: Debugger): ScheduledTask => {
    const debug = log.extend('schedule');
    let timer: NodeJS.Timeout | undefined;
    let stopped = false;

    const run = (): void => {
        if (stopped) {
            return;
        }
        const delay = millisecondsUntilHourUtc(hourUtc, new Date());
        debug(`Next run in ${Math.round(delay / 1000)}s`);
        timer = setTimeout(() => {
            debug('Tick');
            void Promise.resolve(task())
                .catch((error: unknown) => {
                    process.stderr.write(`Scheduled task failed: ${String(error)}\n`);
                })
                .finally(run);
        }, delay);
    };

    run();

    return {
        stop: (): void => {
            stopped = true;
            if (timer) {
                clearTimeout(timer);
            }
        },
    };
};

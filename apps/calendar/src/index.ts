import { ApiClient, debug as rootDebug, failFast, handleShutdown, optionalEnv,
    scheduleDaily } from '@birthday-bot/common';

import { ApiService } from './api.service.ts';
import { sendBirthdayNotifications } from './send-birthday-notifications.task.ts';

const debug = rootDebug.extend('calendar');

/** 18:00 UTC, unchanged from the `0 0 18 * * *` cron entry this replaces. */
const NOTIFICATION_HOUR_UTC = 18;

const start = (): void => {
    debug('Hello!');
    debug(`NodeJS version ${process.version}`);

    const apiUrl = optionalEnv('BIRTHDAYBOT_API_URL', 'http://api:3000');
    const apiService = new ApiService(new ApiClient(apiUrl, debug));

    const task = scheduleDaily(
        NOTIFICATION_HOUR_UTC,
        () => sendBirthdayNotifications(apiService, debug),
        debug,
    );

    // The pending timer is what keeps the process alive; there is nothing else to wait
    // on. handleShutdown's stop() clears it, which lets the event loop drain.
    handleShutdown(() => {
        task.stop();
    }, debug);
};

try {
    start();
} catch (error: unknown) {
    failFast(error);
}

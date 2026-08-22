import { type Debugger } from '@birthday-bot/common';

import { type ApiService } from './api.service.ts';
import { notificationTypeFor } from './notification-window.ts';

/**
 * One pass over every stored birthday.
 *
 * A failure for one birthday is logged and the loop continues; one unreachable
 * channel should not stop everybody else's notifications for the day.
 */
export const sendBirthdayNotifications = async (
    apiService: ApiService,
    log: Debugger,
    now: Date = new Date(),
): Promise<void> => {
    const debug = log.extend('SendBirthdayNotifications');
    debug('Tick');

    const birthdays = await apiService.getBirthdays();
    debug(`Checking ${birthdays.length} birthdays`);

    for (const birthday of birthdays) {
        const notificationType = notificationTypeFor(birthday.birthday, now);
        if (!notificationType) {
            continue;
        }

        debug(`Notification type ${notificationType} for ${birthday.id}`);
        try {
            await apiService.sendBirthdayNotification(birthday.id, notificationType);
        } catch (error: unknown) {
            process.stderr.write(`Could not notify for ${birthday.id}: ${String(error)}\n`);
        }
    }
};

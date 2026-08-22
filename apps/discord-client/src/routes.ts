/**
 * The notification webhook the calendar service calls through the gateway.
 *
 * A port of NotificationsRoute. The one behavioural change: a failure while sending
 * no longer puts the raw caught value in the response body, which leaked internals
 * and was not JSON-serialisable for an Error in the first place.
 */
import { type Debugger, type NotificationInput, type RequestContext, type Route,
    sendBadRequest, sendNotFound, sendServerError, sendSuccess,
    validateNotificationInput } from '@birthday-bot/common';

import { type ApiService } from './api.service.ts';
import { type DiscordService } from './discord.service.ts';

export const createRoutes = (
    apiService: ApiService,
    discordService: DiscordService,
    log: Debugger,
): Route[] => {
    const debug = log.extend('NotificationsRoute');

    const sendNotification = async ({ body, response }: RequestContext): Promise<void> => {
        const reason = validateNotificationInput(body);
        if (reason) {
            sendBadRequest(response, reason);
            return;
        }

        const { id, notificationType } = body as NotificationInput;

        let birthday;
        try {
            birthday = await apiService.getBirthday(id);
        } catch (error: unknown) {
            debug(`Could not fetch birthday ${id}: ${String(error)}`);
            sendServerError(response, 'Could not fetch the birthday');
            return;
        }

        if (!birthday) {
            sendNotFound(response, id);
            return;
        }

        try {
            await discordService.sendDiscordNotification(notificationType, birthday);
        } catch (error: unknown) {
            debug(`Could not notify for ${id}: ${String(error)}`);
            sendServerError(response, 'Could not send the notification');
            return;
        }

        sendSuccess(response);
    };

    return [
        { handler: sendNotification, method: 'POST', path: '/' },
    ];
};

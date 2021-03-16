import { BirthdayNotificationType, IBirthday, INotification, Unsure } from '@birthday-bot/interfaces';
import { BaseRouter, Request, Response } from '@ionaru/micro-web-service';
import { StatusCodes } from 'http-status-codes';

import { ApiService } from '../services/api.service';
import { DiscordService } from '../services/discord.service';

export default class NotificationsRoute extends BaseRouter {
    public constructor(
        private readonly discordService: DiscordService,
        private readonly apiService: ApiService,
    ) {
        super();
        this.createRoute('post', '/', this.sendNotification.bind(this));
        this.createRoute('all', '/', NotificationsRoute.methodNotAllowed);
    }

    private async sendNotification(request: Request<unknown, unknown, Unsure<INotification>, unknown>, response: Response) {
        if (!request.body.id || typeof request.body.id !== 'string') {
            return NotificationsRoute.sendBadRequest(response, 'id', 'Invalid');
        }

        if (
            !request.body.notificationType
            || typeof request.body.notificationType !== 'number'
            || !(request.body.notificationType in BirthdayNotificationType)
        ) {
            return NotificationsRoute.sendBadRequest(response, 'notificationType', 'Invalid');
        }

        let birthday: IBirthday | undefined;
        try {
            birthday = await this.apiService.getBirthday(request.body.id);
        } catch (e) {
            return NotificationsRoute.sendResponse(response, StatusCodes.INTERNAL_SERVER_ERROR, e);
        }

        if (!birthday) {
            return NotificationsRoute.sendNotFound(response, request.body.id);
        }

        try {
            await this.discordService.sendDiscordNotification(request.body.notificationType, birthday);
        } catch (e) {
            return NotificationsRoute.sendResponse(response, StatusCodes.INTERNAL_SERVER_ERROR, e);
        }

        return NotificationsRoute.sendSuccess(response);
    }
}

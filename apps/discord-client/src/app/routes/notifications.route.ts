import { BirthdayNotificationType, IBirthday, INotification } from '@birthday-bot/interfaces';
import { getNumberEnumValues } from '@ionaru/array-utils';
import { AjvValidationRoute, Request, Response } from '@ionaru/micro-web-service';
import { ValidateFunction } from 'ajv';
import { StatusCodes } from 'http-status-codes';

import { debug } from '../../debug';
import { ApiService } from '../services/api.service';
import { DiscordService } from '../services/discord.service';

export class NotificationsRoute extends AjvValidationRoute {

    private static readonly debug = debug.extend('NotificationsRoute');

    public readonly sendNotificationValidator: ValidateFunction<{ id: string; notificationType: BirthdayNotificationType }>;

    public constructor(
        private readonly discordService: DiscordService,
        private readonly apiService: ApiService,
    ) {
        super(NotificationsRoute.debug);
        this.createRoute('post', '/', this.sendNotification.bind(this));
        this.createRoute('all', '/', NotificationsRoute.methodNotAllowed);

        this.sendNotificationValidator = this.createValidateFunction({
            properties: {
                id: {type: 'string', format: 'uuid'},
                notificationType: {
                    enum: [...getNumberEnumValues(BirthdayNotificationType)],
                    type: 'number',
                },
            },
            required: ['id', 'notificationType'],
            type: 'object',
        });
    }

    private async sendNotification(request: Request<unknown, INotification>, response: Response) {
        if (!NotificationsRoute.validate(request.body, this.sendNotificationValidator, response)) {
            return;
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

import Birthday from '@birthday-bot/entities';
import { IBirthday, Unsure } from '@birthday-bot/interfaces';
import { BaseRouter, Request, Response } from '@ionaru/micro-web-service';
import { StatusCodes } from 'http-status-codes';

export default class BirthdaysRoute extends BaseRouter {
    public constructor() {
        super();
        this.createRoute('get', '/', BirthdaysRoute.getBirthdays);
        this.createRoute('post', '/', BirthdaysRoute.postBirthday);
        this.createRoute('all', '/', BirthdaysRoute.methodNotAllowed);

        this.createRoute('get', '/:id', BirthdaysRoute.getBirthday);
        this.createRoute('delete', '/:id', BirthdaysRoute.deleteBirthday);
        this.createRoute('all', '*', BirthdaysRoute.methodNotAllowed);
    }

    private static async deleteBirthday(request: Request<{ id?: string }, unknown, unknown, unknown>, response: Response) {
        if (!request.params.id) {
            return BirthdaysRoute.sendBadRequest(response, 'id', 'Invalid');
        }

        const [user, channel] = request.params.id.split(':');

        const birthday = await Birthday.findOne({channel, user});

        if (!birthday) {
            return BirthdaysRoute.sendNotFound(response, request.params.id);
        }

        await birthday.remove();

        return BirthdaysRoute.sendSuccess(response);
    }

    private static async getBirthday(request: Request<{ id?: string }, unknown, unknown, unknown>, response: Response) {
        if (!request.params.id) {
            return BirthdaysRoute.sendBadRequest(response, 'id', 'Invalid');
        }

        const birthday = await Birthday.findOne(request.params.id);
        if (!birthday) {
            return BirthdaysRoute.sendNotFound(response, request.params.id);
        }

        return BirthdaysRoute.sendSuccess(response, birthday);
    }

    private static async getBirthdays(_request: Request, response: Response) {
        const birthdays = await Birthday.find();
        return BirthdaysRoute.sendSuccess(response, birthdays);
    }

    private static async postBirthday(request: Request<unknown, unknown, Unsure<IBirthday>, unknown>, response: Response) {
        if (!request.body.user || typeof request.body.user !== 'string') {
            return BirthdaysRoute.sendBadRequest(response, 'user', 'Invalid');
        }

        if (!request.body.channel || typeof request.body.channel !== 'string') {
            return BirthdaysRoute.sendBadRequest(response, 'channel', 'Invalid');
        }

        if (!request.body.birthday || typeof request.body.birthday !== 'string') {
            return BirthdaysRoute.sendBadRequest(response, 'birthday', 'Invalid');
        }

        const existingBirthday = await Birthday.findOne({
            channel: request.body.channel,
            user: request.body.user,
        });
        if (existingBirthday) {
            return BirthdaysRoute.sendResponse(response, StatusCodes.CONFLICT, 'Duplicate');
        }

        const birthday = new Birthday(
            request.body.user,
            request.body.channel,
            request.body.birthday,
        );
        await birthday.save();

        return BirthdaysRoute.sendSuccess(response, birthday);
    }
}

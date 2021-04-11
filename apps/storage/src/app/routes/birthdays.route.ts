import { AjvValidationRoute, Request, Response } from '@ionaru/micro-web-service';
import { ValidateFunction } from 'ajv';
import { StatusCodes } from 'http-status-codes';

import { debug } from '../../debug';
import { BirthdayService } from '../services/birthday.service';

export class BirthdaysRoute extends AjvValidationRoute {

    private static readonly debug = debug.extend('BirthdaysRoute');

    public readonly postBirthdayValidator: ValidateFunction<{ birthday: string; channel: string; user: string }>;
    public readonly getBirthdayValidator: ValidateFunction<{ id: string }>;
    public readonly deleteBirthdayValidator: ValidateFunction<{ id: string }>;

    public constructor(
        private readonly birthdayService: BirthdayService,
    ) {
        super(BirthdaysRoute.debug);
        this.createRoute('get', '/', this.getBirthdays.bind(this));
        this.createRoute('post', '/', this.postBirthday.bind(this));
        this.createRoute('all', '/', BirthdaysRoute.methodNotAllowed);

        this.createRoute('get', '/:id', this.getBirthday.bind(this));
        this.createRoute('delete', '/:id', this.deleteBirthday.bind(this));
        this.createRoute('all', '*', BirthdaysRoute.methodNotAllowed);

        // A combination of user and channel.
        this.ajv.addFormat('birthday-identifier', /^\d+:\d+$/);

        this.postBirthdayValidator = this.createValidateFunction({
            properties: {
                birthday: {type: 'string', format: 'date'},
                channel: {type: 'string'},
                user: {type: 'string'},
            },
            required: ['birthday', 'channel', 'user'],
            type: 'object',
        });

        this.getBirthdayValidator = this.createValidateFunction({
            properties: {
                id: {type: 'string', format: 'uuid'},
            },
            required: ['id'],
            type: 'object',
        });

        this.deleteBirthdayValidator = this.createValidateFunction({
            properties: {
                id: {type: 'string', format: 'birthday-identifier'},
            },
            required: ['id'],
            type: 'object',
        });
    }

    private async getBirthdays(_request: Request, response: Response) {
        return BirthdaysRoute.sendSuccess(
            response, this.birthdayService.sortBirthdays(await this.birthdayService.getBirthdays()),
        );
    }

    private async deleteBirthday({params}: Request<{ id: string }>, response: Response) {
        if (!BirthdaysRoute.validate(params, this.deleteBirthdayValidator, response)) {
            return;
        }

        const {id} = params;
        const [user, channel] = id.split(':');

        const birthday = await this.birthdayService.getBirthdayByQuery({user, channel});

        if (!birthday) {
            return BirthdaysRoute.sendNotFound(response, id);
        }

        await this.birthdayService.deleteBirthday(birthday);

        return BirthdaysRoute.sendSuccess(response);
    }

    private async getBirthday({params}: Request, response: Response) {
        if (!BirthdaysRoute.validate(params, this.getBirthdayValidator, response)) {
            return;
        }

        const birthday = await this.birthdayService.getBirthdayById(params.id);
        if (!birthday) {
            return BirthdaysRoute.sendNotFound(response, params.id);
        }

        return BirthdaysRoute.sendSuccess(response, birthday);
    }

    private async postBirthday({body}: Request, response: Response) {
        if (!BirthdaysRoute.validate(body, this.postBirthdayValidator, response)) {
            return;
        }

        const {user, channel, birthday} = body;

        const existingBirthday = await this.birthdayService.getBirthdayByQuery({user, channel});
        if (existingBirthday) {
            return BirthdaysRoute.sendResponse(response, StatusCodes.CONFLICT, 'Duplicate');
        }

        const newBirthday = this.birthdayService.createBirthday(user, channel, birthday);
        return BirthdaysRoute.sendSuccess(response, newBirthday);
    }
}

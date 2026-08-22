/**
 * The birthday CRUD routes.
 *
 * A direct port of BirthdaysRoute, with the Ajv validators replaced by the checks in
 * @birthday-bot/common and the missing `await` on the create path fixed: the old
 * handler serialised a pending promise, so a successful POST answered `{}` and a
 * database failure became an unhandled rejection rather than a 500.
 */
import { type Debugger, type RequestContext, type Route, sendBadRequest, sendConflict,
    sendNotFound, sendSuccess, validateBirthdayInput } from '@birthday-bot/common';
import { type BirthdayInput } from '@birthday-bot/common';

import { birthdayRepository } from './models/birthday.model.ts';

export const createRoutes = (log: Debugger): Route[] => {
    const debug = log.extend('BirthdaysRoute');

    const getBirthdays = ({ response }: RequestContext): void => {
        const birthdays = birthdayRepository.sorted();
        debug(`Returning ${birthdays.length} birthdays`);
        sendSuccess(response, birthdays);
    };

    const postBirthday = ({ body, response }: RequestContext): void => {
        const reason = validateBirthdayInput(body);
        if (reason) {
            sendBadRequest(response, reason);
            return;
        }

        const { birthday, channel, user } = body as BirthdayInput;

        if (birthdayRepository.findByUserAndChannel(user, channel)) {
            debug(`Duplicate birthday for ${user} in ${channel}`);
            sendConflict(response, 'Duplicate');
            return;
        }

        const created = birthdayRepository.insert(user, channel, birthday);
        debug(`Created birthday ${created.id}`);
        sendSuccess(response, created);
    };

    const getBirthday = ({ params, response }: RequestContext): void => {
        const birthday = birthdayRepository.findById(params['id']);
        if (!birthday) {
            sendNotFound(response, params['id']);
            return;
        }
        sendSuccess(response, birthday);
    };

    /** The id here is a `user:channel` pair, not the row's UUID. */
    const deleteBirthday = ({ params, response }: RequestContext): void => {
        const id = params['id'];
        const [user, channel] = id.split(':');

        const birthday = user && channel
            ? birthdayRepository.findByUserAndChannel(user, channel)
            : undefined;

        if (!birthday) {
            sendNotFound(response, id);
            return;
        }

        birthdayRepository.deleteById(birthday.id);
        debug(`Deleted birthday ${birthday.id}`);
        sendSuccess(response);
    };

    return [
        { handler: getBirthdays, method: 'GET', path: '/' },
        { handler: postBirthday, method: 'POST', path: '/' },
        { handler: getBirthday, method: 'GET', path: '/:id' },
        { handler: deleteBirthday, method: 'DELETE', path: '/:id' },
    ];
};

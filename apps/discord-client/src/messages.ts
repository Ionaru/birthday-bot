import { BIRTHDAY_NOTIFICATION_TYPE, type BirthdayNotificationType } from '@birthday-bot/interfaces';

/**
 * The notification text, kept exactly as it was.
 *
 * Pure so it can be asserted on without a Discord connection; the wording is the
 * only part of this bot anybody actually sees.
 */
export const buildNotificationMessage = (
    type: BirthdayNotificationType,
    name: string,
    birthday: string,
): string => {
    if (type === BIRTHDAY_NOTIFICATION_TYPE.TODAY) {
        return `@here\n**HAPPY BIRTHDAY ${name.toUpperCase()}!!!!!!!** 🎂🎈`;
    }

    let when: string;
    switch (type) {
        case BIRTHDAY_NOTIFICATION_TYPE.DAY:
            when = 'Tomorrow ';
            break;
        case BIRTHDAY_NOTIFICATION_TYPE.WEEK:
            when = 'Next week ';
            break;
        case BIRTHDAY_NOTIFICATION_TYPE.FORTNIGHT:
            when = 'In two weeks ';
            break;
        default:
            when = `At some point (${birthday}) `;
    }

    return `@here\n${when}we celebrate the birthday of ${name}!`;
};

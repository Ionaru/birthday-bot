import { BaseModel } from '@ionaru/typeorm-utils';

type BaseModelProps = Pick<BaseModel, 'id' | 'createdOn' | 'updatedOn' | 'deletedOn'>;

export interface IBirthday extends BaseModelProps {
    user: string;
    channel: string;
    birthday: string;
}

export interface INotification {
    id: string;
    notificationType: BirthdayNotificationType;
}

export enum BirthdayNotificationType {
    // Start at index 1 to make checks for undefined easier.
    TODAY = 1,
    DAY,
    WEEK,
    FORTNIGHT,
}

export class HandledError extends Error {}

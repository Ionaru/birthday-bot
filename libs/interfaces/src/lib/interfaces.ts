import { BaseModel } from '@ionaru/typeorm-utils';

type BaseModelProps = Pick<BaseModel, 'id' | 'createdOn' | 'updatedOn' | 'deletedOn'>;

export type Unsure<T> = {
    [P in keyof T]: unknown;
};

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
    TODAY,
    DAY,
    WEEK,
    FORTNIGHT,
}

import { IBirthday } from '@birthday-bot/interfaces';
import { BaseModel } from '@ionaru/typeorm-utils';
import { Column, Entity, Unique } from 'typeorm';

@Entity({
    name: Birthday.alias,
})
@Unique(['user', 'channel'])
export class Birthday extends BaseModel implements IBirthday {

    public static readonly alias = 'birthday';

    @Column()
    public user!: string;

    @Column()
    public channel!: string;

    @Column()
    public birthday!: string;

    public constructor(user: string, channel: string, date: string) {
        super();
        this.user = user;
        this.channel = channel;
        this.birthday = date;
    }
}

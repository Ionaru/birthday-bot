import { BirthdayNotificationType, IBirthday } from '@birthday-bot/interfaces';
import { Client, DMChannel, GuildMember, Message, TextChannel, User, WebSocketManager } from 'discord.js';
import { InteractionHandler } from 'slash-create/lib/server';

export class DiscordService {
    public constructor(
        private readonly discordClient: Client,
    ) {}

    public getUserName(user: GuildMember | User | undefined, id: string): string {
        if (!user) {
            return `Unknown user with id: ${id}`;
        }
        return user instanceof User ? user.username : user.displayName;
    }

    public async getUsersInChannel(id: string): Promise<Array<GuildMember | User>> {
        const channel = await this.discordClient.channels.fetch(id);
        if (!channel.isText()) {
            return [];
        }

        if (channel instanceof TextChannel) {
            const guild = await channel.guild.fetch();
            const members = await guild.members.fetch();
            return members.array();
        }

        if (channel instanceof DMChannel) {
            return [channel.recipient];
        }

        return [];
    }

    public getCommandHandler(): (handler: InteractionHandler) => WebSocketManager {
        return (handler: InteractionHandler) => this.discordClient.ws.on('INTERACTION_CREATE' as any, handler);
    }

    public async sendDiscordNotification(type: BirthdayNotificationType, birthday: IBirthday): Promise<Message> {
        const channel = await this.discordClient.channels.fetch(birthday.channel);

        if (!channel || !channel.isText()) {
            throw new Error(`Could not find channel: ${birthday.channel}`);
        }

        const channelUsers = await this.getUsersInChannel(birthday.channel);
        const birthdayUser = channelUsers.find((user) => user.id === birthday.user);
        const name = this.getUserName(birthdayUser, birthday.user);

        let message = '@here\n';

        if (type === BirthdayNotificationType.TODAY) {
            message = `@here\n**HAPPY BIRTHDAY ${name.toUpperCase()}!!!!!!!** 🎂🎈`;
            return channel.send(message);
        }

        switch (type) {
            case BirthdayNotificationType.DAY:
                message += 'Tomorrow ';
                break;
            case BirthdayNotificationType.WEEK:
                message += 'Next week ';
                break;
            case BirthdayNotificationType.FORTNIGHT:
                message += 'In two weeks ';
                break;
            default:
                message += `At some point (${birthday.birthday}) `;
        }

        message += `we celebrate the birthday of ${name}!`;
        return channel.send(message);
    }

    public getUsername(): string | undefined {
        return this.discordClient.user?.username;
    }
}

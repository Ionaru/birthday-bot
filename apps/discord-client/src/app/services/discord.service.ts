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
            return channel.members.array();
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

        let message: string | undefined;
        switch (type) {
            case BirthdayNotificationType.TODAY:
                message = 'TODAY!';
                break;
            case BirthdayNotificationType.DAY:
                message = 'DAY!';
                break;
            case BirthdayNotificationType.WEEK:
                message = 'WEEK!';
                break;
            case BirthdayNotificationType.FORTNIGHT:
                message = 'FORTNIGHT!';
        }

        if (!message) {
            throw new Error(`No message.`);
        }

        return channel.send(message);
    }

    public getUsername(): string | undefined {
        return this.discordClient.user?.username;
    }
}

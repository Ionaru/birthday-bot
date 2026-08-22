import { type Debugger } from '@birthday-bot/common';
import { type BirthdayNotificationType, type IBirthday } from '@birthday-bot/interfaces';
import { type Client, DMChannel, type Message } from 'discord.js';

import { buildNotificationMessage } from './messages.ts';

const unknownUser = (id: string): string => `Unknown user with id: ${id}`;

export class DiscordService {

    private readonly client: Client;
    private readonly debug: Debugger;

    public constructor(client: Client, log: Debugger) {
        this.client = client;
        this.debug = log.extend('DiscordService');
    }

    public getUsername(): string | undefined {
        return this.client.user?.username;
    }

    /**
     * Display names for the given users in the given channel.
     *
     * The old implementation called `guild.members.fetch()` with no argument, pulling
     * the entire member list. In discord.js v14 that goes over the gateway and needs
     * the privileged GuildMembers intent. Fetching one id at a time uses
     * `GET /guilds/{guild}/members/{user}` over REST, which needs no privileged
     * intent, and discord.js caches the results.
     */
    public async getUserNames(channelId: string, userIds: readonly string[]): Promise<Map<string, string>> {
        const names = new Map<string, string>();
        const channel = await this.client.channels.fetch(channelId);

        if (channel instanceof DMChannel) {
            for (const id of userIds) {
                names.set(id, channel.recipient?.id === id
                    ? channel.recipient.username
                    : await this.fetchGlobalName(id));
            }
            return names;
        }

        const guild = channel && 'guild' in channel ? channel.guild : undefined;

        await Promise.all(userIds.map(async (id) => {
            if (guild) {
                try {
                    const member = await guild.members.fetch(id);
                    names.set(id, member.displayName);
                    return;
                } catch {
                    // Left the server, or never was a member. Fall through to the user.
                    this.debug(`No guild member ${id} in ${guild.id}`);
                }
            }
            names.set(id, await this.fetchGlobalName(id));
        }));

        return names;
    }

    public async sendDiscordNotification(
        type: BirthdayNotificationType,
        birthday: IBirthday,
    ): Promise<Message> {
        const channel = await this.client.channels.fetch(birthday.channel);

        if (!channel?.isSendable()) {
            throw new Error(`Could not find channel: ${birthday.channel}`);
        }

        const names = await this.getUserNames(birthday.channel, [birthday.user]);
        const name = names.get(birthday.user) ?? unknownUser(birthday.user);

        this.debug(`Notifying ${birthday.channel} about ${name}`);
        return channel.send(buildNotificationMessage(type, name, birthday.birthday));
    }

    private async fetchGlobalName(id: string): Promise<string> {
        try {
            const user = await this.client.users.fetch(id);
            return user.username;
        } catch {
            return unknownUser(id);
        }
    }
}

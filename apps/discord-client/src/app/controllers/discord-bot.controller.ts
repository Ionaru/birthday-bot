import { Client } from 'discord.js';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';

export class DiscordBotController {

    private static readonly debug = debug.extend('DiscordBotController');

    private readonly client: Client;

    public constructor() {
        DiscordBotController.debug('Start');

        const token = process.env.BB_DISCORD_TOKEN;

        if (!token) {
            throw new Error('Discord configuration error!');
        }

        DiscordBotController.debug('Configuration OK');

        this.client = new Client();
        this.client.token = token;

        DiscordBotController.debug('Ready');
    }

    public async init(): Promise<DiscordService> {
        DiscordBotController.debug('Init');
        await this.client.login();

        this.client.once('error', (e) => {
            process.emitWarning(`Connection closed, reason: ${e}`);
            this.init().then();
        });

        return new DiscordService(this.client);
    }

    public async stop(): Promise<void> {
        DiscordBotController.debug('Stop');
        await this.client.destroy();
        DiscordBotController.debug('Finished');
    }

}

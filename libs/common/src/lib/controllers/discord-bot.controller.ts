import { Debugger } from 'debug';
import { Client } from 'discord.js';

export class DiscordBotController {

    private readonly debug: Debugger;
    private readonly client: Client;

    public constructor(debug: Debugger) {
        this.debug = debug.extend(this.constructor.name);
        this.debug('Start');

        const token = process.env.BB_DISCORD_TOKEN;

        if (!token) {
            throw new Error('Discord configuration error!');
        }

        this.debug('Configuration OK');

        this.client = new Client();
        this.client.token = token;

        this.debug('Ready');
    }

    public async init<T>(serviceClass: new(client: Client) => T): Promise<T> {
        this.debug('Init');
        await this.client.login();

        this.client.once('error', (e) => {
            process.emitWarning(`Connection closed, reason: ${e}`);
            this.init(serviceClass).then();
        });

        return new serviceClass(this.client);
    }

    public async stop(): Promise<void> {
        this.debug('Stop');
        await this.client.destroy();
        this.debug('Finished');
    }

}

import { GatewayServer, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';
import { SlashCreatorService } from '../services/slash-creator.service';

export class SlashCreatorController {

    private static readonly debug = debug.extend('SlashCreatorController');

    private readonly creator: SlashCreator;

    public constructor() {
        SlashCreatorController.debug('Start');

        const applicationID = process.env.BB_DISCORD_ID;
        const publicKey = process.env.BB_DISCORD_KEY;
        const token = process.env.BB_DISCORD_TOKEN;

        if (!applicationID || !publicKey || !token) {
            throw new Error('SlashCreator configuration error!');
        }

        SlashCreatorController.debug('Configuration OK');

        this.creator = new SlashCreator({applicationID, publicKey, token});
        this.creator.on('commandError', (_, e) => { throw e; });
        this.creator.on('error', (e) => { throw e; });

        SlashCreatorController.debug('Ready');
    }

    public static getCommandGuilds(): string[] {
        const guildsRaw = process.env.BB_DISCORD_GUILDS;

        if (!guildsRaw) {
            throw new Error('Command configuration error!');
        }

        return guildsRaw.toString()
            .split(',')
            .map((id) => id.trim());
    }

    public init(discordService: DiscordService): SlashCreatorService {
        SlashCreatorController.debug('Init');
        this.creator.withServer(new GatewayServer(discordService.getCommandHandler()));
        return new SlashCreatorService(this.creator);
    }

}

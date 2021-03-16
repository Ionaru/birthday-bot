/* eslint-disable @typescript-eslint/tslint/config */
import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { DiscordService } from '../services/discord.service';

export default class InfoCommand extends SlashCommand {

    private static readonly debug = debug.extend('InfoCommand');

    public constructor(
        creator: SlashCreator,
        private readonly discordService: DiscordService,
    ) {
        super(creator, {
            name: 'info',
            description: 'Show information about the bot',
            guildIDs: '302014526201659392',
        });
    }

    public async run(context: CommandContext): Promise<void> {
        InfoCommand.debug('Received');
        await context.acknowledge(true);
        await context.send(`Hey, this is ${this.discordService.getUsername()}! :tada:`);
    }
}

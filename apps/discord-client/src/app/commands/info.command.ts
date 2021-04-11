/* eslint-disable @typescript-eslint/tslint/config */
import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { SlashCreatorController } from '../controllers/slash-creator.controller';
import { DiscordService } from '../services/discord.service';

export class InfoCommand extends SlashCommand {

    private static readonly debug = debug.extend('InfoCommand');

    public constructor(
        creator: SlashCreator,
        private readonly discordService: DiscordService,
    ) {
        super(creator, {
            name: 'info',
            description: 'Show information about the bot',
            guildIDs: SlashCreatorController.getCommandGuilds(),
        });
    }

    public async run(context: CommandContext): Promise<void> {
        InfoCommand.debug('Received');
        await context.defer(true);
        await context.send(`Hey, this is ${this.discordService.getUsername()}! :tada:`);
    }
}

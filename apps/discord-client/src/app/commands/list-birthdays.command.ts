/* eslint-disable @typescript-eslint/tslint/config */
import { CommandContext, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { SlashCreatorController } from '../controllers/slash-creator.controller';
import { ApiService } from '../services/api.service';
import { DiscordService } from '../services/discord.service';

export default class ListBirthdaysCommand extends SlashCommand {

    private static readonly debug = debug.extend('ListBirthdaysCommand');

    public constructor(
        creator: SlashCreator,
        private readonly apiService: ApiService,
        private readonly discordService: DiscordService,
    ) {
        super(creator, {
            name: 'list-birthdays',
            description: 'List the registered birthdays in this channel.',
            guildIDs: SlashCreatorController.getCommandGuilds(),
        });
    }

    public async run(context: CommandContext): Promise<void> {
        ListBirthdaysCommand.debug('Received');
        await context.acknowledge(true);

        const birthdays = await this.apiService.getBirthdays();

        if (!birthdays.length) {
            context.send('No birthdays found.').then();
            return;
        }

        const channelBirthdays = birthdays.filter((birthday) => birthday.channel === context.channelID);
        const birthdayNames = await this.discordService.getUsersInChannel(context.channelID);

        const birthdaysText = channelBirthdays.map((birthday) => {
            const birthdayUser = birthdayNames.find((user) => user.id === birthday.user);
            return `• ${this.discordService.getUserName(birthdayUser)}, ${birthday.birthday}`;
        }).join('\n');
        context.send(`⠀\n**Birthdays**\n${birthdaysText}`).then();
    }
}

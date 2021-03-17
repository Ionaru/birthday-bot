/* eslint-disable @typescript-eslint/tslint/config */
import { HandledError } from '@birthday-bot/interfaces';
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { SlashCreatorController } from '../controllers/slash-creator.controller';
import { ApiService } from '../services/api.service';

export class RemoveBirthdayCommand extends SlashCommand {

    private static readonly debug = debug.extend('RemoveBirthdayCommand');

    public constructor(
        creator: SlashCreator,
        private readonly apiService: ApiService,
    ) {
        super(creator, {
            name: 'remove-birthday',
            description: 'Remove a birthday 😢',
            guildIDs: SlashCreatorController.getCommandGuilds(),
            options: [
                {
                    type: CommandOptionType.USER,
                    name: 'user',
                    description: 'The birthday person',
                    required: true,
                },
            ],
        });
    }

    public async run(context: CommandContext): Promise<void> {
        RemoveBirthdayCommand.debug('Received');
        await context.acknowledge(true);

        const user = context.options.user as string;

        try {
            await this.apiService.deleteBirthday(user, context.channelID);
        } catch (e: unknown) {
            await context.send(`Could not delete birthday, reason: ${e}`);
            if (!(e instanceof HandledError)) {
                throw e;
            }
            return;
        }

        context.send(`Birthday deleted.`).then();
    }
}

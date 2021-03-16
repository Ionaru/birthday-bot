/* eslint-disable @typescript-eslint/tslint/config */
import { HandledError } from '@birthday-bot/interfaces';
import { CommandContext, CommandOptionType, SlashCommand, SlashCreator } from 'slash-create';

import { debug } from '../../debug';
import { SlashCreatorController } from '../controllers/slash-creator.controller';
import { ApiService } from '../services/api.service';

export default class AddBirthdayCommand extends SlashCommand {

    private static readonly debug = debug.extend('AddBirthdayCommand');

    public constructor(
        creator: SlashCreator,
        private readonly apiService: ApiService,
    ) {
        super(creator, {
            name: 'add-birthday',
            description: 'Add a birthday 🎂',
            guildIDs: SlashCreatorController.getCommandGuilds(),
            options: [{
                type: CommandOptionType.USER,
                name: 'user',
                description: 'The birthday person',
                required: true,
            }, {
                type: CommandOptionType.INTEGER,
                name: 'day',
                description: 'The day of the birthday',
                required: true,
            }, {
                type: CommandOptionType.INTEGER,
                name: 'month',
                description: 'The month of the birthday.',
                required: true,
            }, {
                type: CommandOptionType.INTEGER,
                name: 'year',
                description: 'The year the person is born~',
            }],
        });
    }

    private static pad(input: number): string {
        return input.toString().padStart(2, '0');
    }

    public async run(context: CommandContext): Promise<void> {
        AddBirthdayCommand.debug('Received');
        await context.acknowledge(true);

        const channel = context.channelID;
        const user = context.options.user as string;
        const day = context.options.day as number;
        const month = context.options.month as number;
        const year = context.options.year as number | undefined;

        const birthday = this.getDateString(day, month, year);

        if (isNaN(Date.parse(birthday))) {
            context.send(`Could not register birthday, reason: Invalid date`).then();
            return;
        }

        try {
            await this.apiService.createBirthday(user, channel, birthday);
        } catch (e: unknown) {
            await context.send(`Could not register birthday, reason: ${e}`);
            if (!(e instanceof HandledError)) {
                throw e;
            }
            return;
        }

        context.send(`Birthday registered.`).then();
    }

    private getDateString(day: number, month: number, year?: number): string {
        if (!year) {
            const now = new Date();
            const currentYear = now.getUTCFullYear();
            const currentMonth = now.getUTCMonth() + 1;
            const currentDay = now.getUTCDate();

            if (month <= currentMonth && day <= currentDay) {
                // Birthday is in the past of this year
                return this.getDateString(day, month, currentYear + 1);
            } else {
                // Birthday is in the future of this year.
                return this.getDateString(day, month, currentYear);
            }
        }

        return `${year}-${AddBirthdayCommand.pad(month)}-${AddBirthdayCommand.pad(day)}`;
    }
}

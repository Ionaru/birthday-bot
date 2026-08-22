import { HandledError } from '@birthday-bot/interfaces';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { type ApiService } from '../api.service.ts';
import { buildBirthdayDate } from '../date.ts';

import { type Command } from './command.ts';

export const createAddBirthdayCommand = (apiService: ApiService): Command => ({
    data: new SlashCommandBuilder()
        .setName('add-birthday')
        .setDescription('Add a birthday 🎂')
        .addUserOption((option) => option
            .setName('user')
            .setDescription('The birthday person')
            .setRequired(true))
        .addIntegerOption((option) => option
            .setName('day')
            .setDescription('The day of the birthday')
            .setMinValue(1)
            .setMaxValue(31)
            .setRequired(true))
        .addIntegerOption((option) => option
            .setName('month')
            .setDescription('The month of the birthday')
            .setMinValue(1)
            .setMaxValue(12)
            .setRequired(true))
        .addIntegerOption((option) => option
            .setName('year')
            .setDescription('The year the person is born')
            .setMinValue(1900))
        .toJSON(),

    execute: async (interaction): Promise<void> => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const user = interaction.options.getUser('user', true);
        const day = interaction.options.getInteger('day', true);
        const month = interaction.options.getInteger('month', true);
        const year = interaction.options.getInteger('year') ?? undefined;

        const birthday = buildBirthdayDate(day, month, year, new Date());
        if (!birthday) {
            await interaction.editReply('Could not register birthday, reason: Invalid date');
            return;
        }

        try {
            await apiService.createBirthday(user.id, interaction.channelId, birthday);
        } catch (error: unknown) {
            // Only a HandledError carries a message meant for a user. Anything else is
            // rethrown untouched so that client.controller.ts reports it generically;
            // editing the reply here first would flash the internal error text and then
            // overwrite it a REST round trip later.
            if (!(error instanceof HandledError)) {
                throw error;
            }
            await interaction.editReply(`Could not register birthday, reason: ${error.message}`);
            return;
        }

        await interaction.editReply('Birthday registered.');
    },

    name: 'add-birthday',
});

import { HandledError } from '@birthday-bot/interfaces';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { type ApiService } from '../api.service.ts';

import { type Command } from './command.ts';

export const createRemoveBirthdayCommand = (apiService: ApiService): Command => ({
    data: new SlashCommandBuilder()
        .setName('remove-birthday')
        .setDescription('Remove a birthday 😢')
        .addUserOption((option) => option
            .setName('user')
            .setDescription('The birthday person')
            .setRequired(true))
        .toJSON(),

    execute: async (interaction): Promise<void> => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const user = interaction.options.getUser('user', true);

        try {
            await apiService.deleteBirthday(user.id, interaction.channelId);
        } catch (error: unknown) {
            // See add-birthday.command.ts: only a HandledError is safe to show.
            if (!(error instanceof HandledError)) {
                throw error;
            }
            await interaction.editReply(`Could not delete birthday, reason: ${error.message}`);
            return;
        }

        await interaction.editReply('Birthday deleted.');
    },

    name: 'remove-birthday',
});

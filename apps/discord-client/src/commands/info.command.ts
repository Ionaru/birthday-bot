import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { type DiscordService } from '../discord.service.ts';

import { type Command } from './command.ts';

export const createInfoCommand = (discordService: DiscordService): Command => ({
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show information about the bot')
        .toJSON(),

    execute: async (interaction): Promise<void> => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await interaction.editReply(`Hey, this is ${discordService.getUsername() ?? 'BirthdayBot'}! :tada:`);
    },

    name: 'info',
});

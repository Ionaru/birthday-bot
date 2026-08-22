import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { type ApiService } from '../api.service.ts';
import { formatMonthDay } from '../date.ts';
import { type DiscordService } from '../discord.service.ts';

import { type Command } from './command.ts';

export const createListBirthdaysCommand = (
    apiService: ApiService,
    discordService: DiscordService,
): Command => ({
    data: new SlashCommandBuilder()
        .setName('list-birthdays')
        .setDescription('List the registered birthdays in this channel.')
        .toJSON(),

    execute: async (interaction): Promise<void> => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const birthdays = await apiService.getBirthdays();
        const channelBirthdays = birthdays.filter((birthday) => birthday.channel === interaction.channelId);

        if (channelBirthdays.length === 0) {
            await interaction.editReply('No birthdays found.');
            return;
        }

        // Only the users on this channel's list, so no full member fetch is needed.
        const names = await discordService.getUserNames(
            interaction.channelId,
            channelBirthdays.map((birthday) => birthday.user),
        );

        const lines = channelBirthdays.map((birthday) =>
            `• ${names.get(birthday.user) ?? `Unknown user with id: ${birthday.user}`}, ${
                formatMonthDay(birthday.birthday)}`);

        await interaction.editReply(`⠀\n**Birthdays**\n${lines.join('\n')}`);
    },

    name: 'list-birthdays',
});

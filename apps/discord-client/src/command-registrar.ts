import { type Debugger } from '@birthday-bot/common';
import { REST, Routes } from 'discord.js';

import { type Command } from './commands/command.ts';

/** `BIRTHDAYBOT_GUILDS` is a comma-separated list; blanks and stray spaces are ignored. */
export const parseGuildIds = (raw: string | undefined): string[] =>
    (raw ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

/**
 * Publishes the command definitions to Discord.
 *
 * With guild IDs set the commands appear immediately, which is what you want while
 * developing. With none set they are registered globally, as TheraBot does, and can
 * take up to an hour to show up the first time.
 */
export const syncCommands = async (
    commands: readonly Command[],
    options: { applicationId: string; guildIds: readonly string[]; token: string },
    log: Debugger,
): Promise<void> => {
    const debug = log.extend('syncCommands');
    const rest = new REST().setToken(options.token);
    const body = commands.map((command) => command.data);

    if (options.guildIds.length === 0) {
        debug('Registering commands globally');
        await rest.put(Routes.applicationCommands(options.applicationId), { body });
        return;
    }

    for (const guildId of options.guildIds) {
        debug(`Registering commands in guild ${guildId}`);
        await rest.put(Routes.applicationGuildCommands(options.applicationId, guildId), { body });
    }
};

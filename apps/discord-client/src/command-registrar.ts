import { type Debugger } from '@birthday-bot/common';
import { REST, type RESTGetAPIApplicationCommandsResult, Routes } from 'discord.js';

import { type Command } from './commands/command.ts';

/** `BIRTHDAYBOT_GUILDS` is a comma-separated list; blanks and stray spaces are ignored. */
export const parseGuildIds = (raw: string | undefined): string[] =>
    (raw ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

export interface CommandScope {
    /** For log output: "globally", "in guild 123". */
    readonly description: string;
    /** discord.js types its routes as a template literal, so keep that through the plan. */
    readonly route: `/${string}`;
}

export interface CommandSyncPlan {
    /** Scopes to empty out, because anything left there shows up as a duplicate. */
    readonly clear: readonly CommandScope[];
    /** The scopes the commands should actually live in. */
    readonly register: readonly CommandScope[];
}

/**
 * Works out where the commands belong, and where they must not linger.
 *
 * Discord keeps global and guild commands in separate buckets and shows both in the
 * picker, so a command registered in both appears twice. A bulk PUT only overwrites
 * the bucket it targets, which is how the 2021 guild-scoped registrations survived the
 * move to global registration and produced a duplicate of every command.
 *
 * So the configured scope is treated as the only scope: whichever bucket is not in use
 * gets emptied. That makes a redeploy self-healing and makes switching
 * BIRTHDAYBOT_GUILDS on or off leave no residue.
 *
 * The consequence worth knowing: development must use its own Discord application. Two
 * deployments sharing one application ID will now clear each other's commands, where
 * before they merely duplicated them.
 */
export const planCommandSync = (
    applicationId: string,
    guildIds: readonly string[],
    joinedGuildIds: readonly string[],
): CommandSyncPlan => {
    const globalScope: CommandScope = {
        description: 'globally',
        route: Routes.applicationCommands(applicationId),
    };
    const guildScope = (guildId: string): CommandScope => ({
        description: `in guild ${guildId}`,
        route: Routes.applicationGuildCommands(applicationId, guildId),
    });

    if (guildIds.length === 0) {
        // Global registration. Clear every guild the bot is actually in; a guild it has
        // left cannot show its commands anyway.
        return { clear: joinedGuildIds.map((id) => guildScope(id)), register: [globalScope] };
    }

    return { clear: [globalScope], register: guildIds.map((id) => guildScope(id)) };
};

/**
 * Publishes the command definitions to Discord.
 *
 * With guild IDs set the commands appear immediately, which is what you want while
 * developing. With none set they are registered globally, as TheraBot does, and can
 * take up to an hour to show up the first time.
 */
export const syncCommands = async (
    commands: readonly Command[],
    options: {
        applicationId: string;
        guildIds: readonly string[];
        joinedGuildIds: readonly string[];
        token: string;
    },
    log: Debugger,
): Promise<void> => {
    const debug = log.extend('syncCommands');
    const rest = new REST().setToken(options.token);
    const body = commands.map((command) => command.data);

    const plan = planCommandSync(options.applicationId, options.guildIds, options.joinedGuildIds);

    for (const scope of plan.register) {
        debug(`Registering commands ${scope.description}`);
        await rest.put(scope.route, { body });
    }

    for (const scope of plan.clear) {
        // Read first so that the steady state is a cheap GET rather than a pointless
        // write on every boot.
        const existing = await rest.get(scope.route) as RESTGetAPIApplicationCommandsResult;
        if (existing.length === 0) {
            continue;
        }
        debug(`Clearing ${existing.length} stale command(s) ${scope.description}`);
        await rest.put(scope.route, { body: [] });
    }
};

import { type Debugger } from '@birthday-bot/common';
import { ActivityType, Client, Events, GatewayIntentBits, type Interaction, Partials } from 'discord.js';

import { type Command } from './commands/command.ts';

export class ClientController {

    public readonly client: Client;

    private readonly debug: Debugger;

    public constructor(log: Debugger) {
        this.debug = log.extend('ClientController');
        this.client = new Client({
            // Guilds alone is enough to resolve channels and post messages, and
            // DirectMessages plus the Channel partial covers birthdays registered in a
            // DM. No privileged intent is required; see DiscordService.getUserNames.
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.DirectMessages,
            ],
            partials: [Partials.Channel],
        });
        this.debug('Client created');
    }

    public async destroy(): Promise<void> {
        this.debug('Destroying client');
        await this.client.destroy();
    }

    /** The ids of the guilds the bot is in. Only valid once login() has resolved. */
    public get joinedGuildIds(): string[] {
        return [...this.client.guilds.cache.keys()];
    }

    /**
     * Resolves once the client is ready, not merely once the token was accepted.
     *
     * client.login() resolves as soon as Discord accepts the token, which is before
     * READY and therefore before guilds.cache is populated. Command registration needs
     * that list to clear stale guild-scoped commands, so wait for the real thing.
     */
    public async login(token: string): Promise<void> {
        this.debug('Logging in');
        this.client.on(Events.Warn, (warning: string) => process.emitWarning(warning));

        const ready = new Promise<void>((resolve) => {
            this.client.once(Events.ClientReady, () => {
                this.client.user?.setActivity('/info', { type: ActivityType.Listening });
                this.debug('Logged in');
                resolve();
            });
        });

        await this.client.login(token);
        await ready;
        this.debug(`In ${this.joinedGuildIds.length} guild(s)`);
    }

    public registerCommandHandler(commands: readonly Command[]): void {
        const byName = new Map(commands.map((command) => [command.name, command]));

        this.client.on(Events.InteractionCreate, (interaction: Interaction) => {
            if (!interaction.isChatInputCommand()) {
                return;
            }

            const command = byName.get(interaction.commandName);
            if (!command) {
                this.debug(`Unknown command: ${interaction.commandName}`);
                return;
            }

            this.debug(`Received ${interaction.commandName}`);
            void command.execute(interaction).catch(async (error: unknown) => {
                process.stderr.write(`Command ${interaction.commandName} failed: ${String(error)}\n`);
                // The command deferred its reply before doing any work, so there is
                // always something to edit rather than leaving Discord's spinner up.
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply('Something went wrong.').catch(() => undefined);
                }
            });
        });
    }
}

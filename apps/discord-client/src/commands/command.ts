import { type ChatInputCommandInteraction, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js';

/**
 * One slash command.
 *
 * Replaces the `SlashCommand` subclasses from slash-create. discord.js v14 handles
 * interactions natively, so the extra library, its GatewayServer hook into
 * `client.ws.on('INTERACTION_CREATE')` and the application public key it needed are
 * all gone.
 */
export interface Command {
    readonly data: RESTPostAPIChatInputApplicationCommandsJSONBody;
    readonly execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
    readonly name: string;
}

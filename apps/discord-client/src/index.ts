import { ApiClient, close, createHttpServer, debug as rootDebug, failFast, handleShutdown,
    listen, optionalEnv, optionalPort, requireEnv } from '@birthday-bot/common';

import { ApiService } from './api.service.ts';
import { ClientController } from './client.controller.ts';
import { parseGuildIds, syncCommands } from './command-registrar.ts';
import { createAddBirthdayCommand } from './commands/add-birthday.command.ts';
import { createInfoCommand } from './commands/info.command.ts';
import { createListBirthdaysCommand } from './commands/list-birthdays.command.ts';
import { createRemoveBirthdayCommand } from './commands/remove-birthday.command.ts';
import { DiscordService } from './discord.service.ts';
import { createRoutes } from './routes.ts';

const debug = rootDebug.extend('discord-client');

const start = async (): Promise<void> => {
    debug('Hello!');
    debug(`NodeJS version ${process.version}`);

    const token = requireEnv('BIRTHDAYBOT_TOKEN');
    const applicationId = requireEnv('BIRTHDAYBOT_ID');
    const guildIds = parseGuildIds(process.env['BIRTHDAYBOT_GUILDS']);

    const clientController = new ClientController(debug);
    await clientController.login(token);

    const discordService = new DiscordService(clientController.client, debug);
    const apiService = new ApiService(
        new ApiClient(optionalEnv('BIRTHDAYBOT_API_URL', 'http://api:3000'), debug),
    );

    const commands = [
        createInfoCommand(discordService),
        createAddBirthdayCommand(apiService),
        createRemoveBirthdayCommand(apiService),
        createListBirthdaysCommand(apiService, discordService),
    ];

    clientController.registerCommandHandler(commands);
    await syncCommands(
        commands,
        { applicationId, guildIds, joinedGuildIds: clientController.joinedGuildIds, token },
        debug,
    );

    const server = createHttpServer(createRoutes(apiService, discordService, debug), debug);
    const port = optionalPort('BIRTHDAYBOT_DISCORD_CLIENT_PORT', 3000);
    await listen(server, port);
    debug(`Listening on port ${port}`);

    handleShutdown(async () => {
        await close(server);
        await clientController.destroy();
    }, debug);
};

start().catch(failFast);

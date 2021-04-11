import { format } from 'util';

import { ApiClientController, DiscordBotController, ServerController } from '@birthday-bot/common';
import { handleExceptions, handleSignals, NotFoundRoute } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { AddBirthdayCommand } from './app/commands/add-birthday.command';
import { InfoCommand } from './app/commands/info.command';
import { ListBirthdaysCommand } from './app/commands/list-birthdays.command';
import { RemoveBirthdayCommand } from './app/commands/remove-birthday.command';
import { SlashCreatorController } from './app/controllers/slash-creator.controller';
import { NotificationsRoute } from './app/routes/notifications.route';
import { ApiService } from './app/services/api.service';
import { DiscordService } from './app/services/discord.service';
import { debug } from './debug';

let discordBotController: DiscordBotController;
let serverController: ServerController;

const start = async () => {

    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    discordBotController = new DiscordBotController(debug);
    const discordService = await discordBotController.init(DiscordService);

    const slashCreatorService = new SlashCreatorController().init(discordService);

    const apiService = new ApiClientController(debug).init(ApiService);

    slashCreatorService.registerCommand((creator) => new InfoCommand(creator, discordService));
    slashCreatorService.registerCommand((creator) => new RemoveBirthdayCommand(creator, apiService));
    slashCreatorService.registerCommand((creator) => new AddBirthdayCommand(creator, apiService));
    slashCreatorService.registerCommand((creator) => new ListBirthdaysCommand(creator, apiService, discordService));

    serverController = new ServerController(
        [
            ['/', new NotificationsRoute(discordService, apiService)],
            ['*', new NotFoundRoute()],
        ],
        debug,
        process.env.BB_DISCORD_CLIENT_PORT,
    );
    await serverController.init();

    await slashCreatorService.syncCommands();

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

const stop = async () => {
    await discordBotController.stop();
    await serverController.stop();
};

const exit = (code = 0) => {
    debug('Bye bye!');
    process.exit(code);
};

start().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});

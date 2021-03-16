import { format } from 'util';

import { handleExceptions, handleSignals, NotFoundRoute } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import AddBirthdayCommand from './app/commands/add-birthday.command';
import InfoCommand from './app/commands/info.command';
import RemoveBirthdayCommand from './app/commands/remove-birthday.command';
import { ApiClientController } from './app/controllers/api-client.controller';
import { DiscordBotController } from './app/controllers/discord-bot.controller';
import { ServerController } from './app/controllers/server.controller';
import { SlashCreatorController } from './app/controllers/slash-creator.controller';
import NotificationsRoute from './app/routes/notifications.route';
import { debug } from './debug';

let discordBotController: DiscordBotController;
let serverController: ServerController;

const start = async () => {

    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    discordBotController = new DiscordBotController();
    const discordService = await discordBotController.init();

    const slashCreatorService = new SlashCreatorController().init(discordService);

    const apiService = new ApiClientController().init();

    slashCreatorService.registerCommand((creator) => new InfoCommand(creator, discordService));
    slashCreatorService.registerCommand((creator) => new RemoveBirthdayCommand(creator, apiService));
    slashCreatorService.registerCommand((creator) => new AddBirthdayCommand(creator, apiService));

    serverController = new ServerController([
        ['/', new NotificationsRoute(discordService, apiService)],
        ['*', new NotFoundRoute()],
    ]);
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

import { format } from 'util';

import { ServerController } from '@birthday-bot/common';
import { handleExceptions, handleSignals, NotFoundRoute } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { DiscordClientProxyController } from './app/controllers/discord-client-proxy.controller';
import { StorageProxyController } from './app/controllers/storage-proxy.controller';
import { DiscordClientRoute } from './app/routes/discord-client.route';
import { StorageRoute } from './app/routes/storage.route';
import { debug } from './debug';

let serverController: ServerController;

const start = async () => {
    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    const storageProxy = new StorageProxyController().init();
    const discordClientProxy = new DiscordClientProxyController().init();

    serverController = new ServerController([
        ['/discord-client', new DiscordClientRoute(discordClientProxy)],
        ['/storage', new StorageRoute(storageProxy)],
        ['*', new NotFoundRoute()],
    ], debug, process.env.BB_API_PORT);
    await serverController.init();

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

const stop = async () => {
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

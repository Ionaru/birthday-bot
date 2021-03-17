import { format } from 'util';

import { handleExceptions, handleSignals, NotFoundRoute } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { DatabaseController } from './app/controllers/database.controller';
import { ServerController } from './app/controllers/server.controller';
import { BirthdaysRoute } from './app/routes/birthdays.route';
import { debug } from './debug';

let serverController: ServerController;
let databaseController: DatabaseController;

const start = async () => {
    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    databaseController = new DatabaseController();
    await databaseController.init();

    serverController = new ServerController([
        ['/', new BirthdaysRoute()],
        ['*', new NotFoundRoute()],
    ]);
    await serverController.init();

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

const stop = async () => {
    await serverController.stop();
    await databaseController.stop();
};

const exit = (code = 0) => {
    debug('Bye bye!');
    process.exit(code);
};

start().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});

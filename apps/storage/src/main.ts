import { format } from 'util';

import { ServerController } from '@birthday-bot/common';
import { handleExceptions, handleSignals, NotFoundRoute } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { DatabaseController } from './app/controllers/database.controller';
import { BirthdaysRoute } from './app/routes/birthdays.route';
import { BirthdayService } from './app/services/birthday.service';
import { debug } from './debug';

let serverController: ServerController;
let databaseController: DatabaseController;

const start = async () => {
    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    databaseController = new DatabaseController();
    await databaseController.init();

    serverController = new ServerController([
        ['/', new BirthdaysRoute(new BirthdayService())],
        ['*', new NotFoundRoute()],
    ], debug, process.env.BB_STORAGE_PORT);
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

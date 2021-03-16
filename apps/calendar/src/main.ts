import { format } from 'util';

import { handleExceptions, handleSignals } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { ApiClientController } from './app/controllers/api-client.controller';
import { SendBirthdayNotificationsTask } from './app/tasks/send-birthday-notifications.task';
import { debug } from './debug';

const start = async () => {
    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    const apiService = new ApiClientController().init();
    new SendBirthdayNotificationsTask(apiService).start();

    handleExceptions(stop, exit);
    handleSignals(stop, exit, debug);
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const stop = async () => {};

const exit = (code = 0) => {
    debug('Bye bye!');
    process.exit(code);
};

start().catch((error) => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
});

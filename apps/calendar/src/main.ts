import { format } from 'util';

import { ApiClientController } from '@birthday-bot/common';
import { handleExceptions, handleSignals } from '@ionaru/micro-web-service';
import { config } from 'dotenv';

import { ApiService } from './app/services/api.service';
import { SendBirthdayNotificationsTask } from './app/tasks/send-birthday-notifications.task';
import { debug } from './debug';

const start = async () => {
    debug(`App start: ${process.env.NODE_ENV}!`);

    config();

    const apiService = new ApiClientController(debug).init(ApiService);
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

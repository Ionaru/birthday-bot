import { close, createHttpServer, debug as rootDebug, failFast, handleShutdown, listen,
    optionalEnv, optionalPort } from '@birthday-bot/common';

import { closeDatabase, initDatabase } from './database/connection.ts';
import { createRoutes } from './routes.ts';

const debug = rootDebug.extend('storage');

const start = async (): Promise<void> => {
    debug('Hello!');
    debug(`NodeJS version ${process.version}`);

    const databasePath = optionalEnv('BIRTHDAYBOT_DB_PATH', 'data/birthday.db');
    initDatabase(databasePath);
    debug(`Database: ${databasePath}`);

    const server = createHttpServer(createRoutes(debug), debug);
    const port = optionalPort('BIRTHDAYBOT_STORAGE_PORT', 3000);
    await listen(server, port);
    debug(`Listening on port ${port}`);

    handleShutdown(async () => {
        await close(server);
        closeDatabase();
    }, debug);
};

start().catch(failFast);

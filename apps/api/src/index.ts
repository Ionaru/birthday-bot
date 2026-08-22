import { close, createHttpServer, debug as rootDebug, failFast, handleShutdown, listen,
    optionalEnv, optionalPort, type Route } from '@birthday-bot/common';

import { createProxyHandler } from './proxy.ts';

const debug = rootDebug.extend('api');

const start = async (): Promise<void> => {
    debug('Hello!');
    debug(`NodeJS version ${process.version}`);

    // Defaults are the Compose service names; only a non-Compose deployment needs to
    // set these.
    const storageUrl = optionalEnv('BIRTHDAYBOT_STORAGE_URL', 'http://storage:3000');
    const discordClientUrl = optionalEnv('BIRTHDAYBOT_DISCORD_CLIENT_URL', 'http://discord-client:3000');

    const routes: Route[] = [
        { handler: createProxyHandler(discordClientUrl, debug), method: 'ALL', path: '/discord-client/*' },
        { handler: createProxyHandler(storageUrl, debug), method: 'ALL', path: '/storage/*' },
    ];

    const server = createHttpServer(routes, debug);
    const port = optionalPort('BIRTHDAYBOT_API_PORT', 3000);
    await listen(server, port);
    debug(`Listening on port ${port}`);

    handleShutdown(() => close(server), debug);
};

start().catch(failFast);

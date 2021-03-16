import * as proxy from 'http-proxy';

import { debug } from '../../debug';
import { ProxyRoute } from '../routes/proxy.route';

export class DiscordClientProxyController {

    private static readonly debug = debug.extend('DiscordClientProxyController');

    private readonly proxy: proxy;

    public constructor() {
        DiscordClientProxyController.debug('Start');

        if (!process.env.BB_DISCORD_CLIENT_URL || !process.env.BB_DISCORD_CLIENT_PORT) {
            throw new Error('Discord-client proxy configuration error!');
        }

        const target = `${process.env.BB_DISCORD_CLIENT_URL}:${process.env.BB_DISCORD_CLIENT_PORT}`;

        if (!target) {
            throw new Error('Discord-client proxy configuration error!');
        }

        DiscordClientProxyController.debug('Configuration OK');

        this.proxy = ProxyRoute.createProxy(target);

        DiscordClientProxyController.debug('Ready');
    }

    public init(): proxy {
        DiscordClientProxyController.debug('Init');
        return this.proxy;
    }
}

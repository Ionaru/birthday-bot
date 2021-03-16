import * as proxy from 'http-proxy';

import { debug } from '../../debug';
import { ProxyRoute } from '../routes/proxy.route';

export class StorageProxyController {

    private static readonly debug = debug.extend('StorageProxyController');

    private readonly proxy: proxy;

    public constructor() {
        StorageProxyController.debug('Start');

        if (!process.env.BB_STORAGE_URL || !process.env.BB_STORAGE_PORT) {
            throw new Error('Storage proxy configuration error!');
        }

        const target = `${process.env.BB_STORAGE_URL}:${process.env.BB_STORAGE_PORT}`;

        if (!target) {
            throw new Error('Storage proxy configuration error!');
        }

        StorageProxyController.debug('Configuration OK');

        this.proxy = ProxyRoute.createProxy(target);

        StorageProxyController.debug('Ready');
    }

    public init(): proxy {
        StorageProxyController.debug('Init');
        return this.proxy;
    }
}

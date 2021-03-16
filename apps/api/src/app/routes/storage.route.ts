import { Request, Response } from '@ionaru/micro-web-service';
import * as proxy from 'http-proxy';

import { ProxyRoute } from './proxy.route';

export class StorageRoute extends ProxyRoute {

    public constructor(
        private readonly storageProxy: proxy,
    ) {
        super();
        this.createRoute('all', '*', this.send.bind(this));
    }

    private send(request: Request, response: Response) {
        this.proxyRequest(this.storageProxy, request, response);
    }
}

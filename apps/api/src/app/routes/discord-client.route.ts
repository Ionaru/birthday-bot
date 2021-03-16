import { Request, Response } from '@ionaru/micro-web-service';
import * as proxy from 'http-proxy';

import { ProxyRoute } from './proxy.route';

export class DiscordClientRoute extends ProxyRoute {

    public constructor(
        private readonly discordClientProxy: proxy,
    ) {
        super();
        this.createRoute('all', '*', this.send.bind(this));
    }

    private send(request: Request, response: Response) {
        this.proxyRequest(this.discordClientProxy, request, response);
    }
}

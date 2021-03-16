import { ClientRequest, IncomingMessage } from 'http';

import { BaseRouter, Request, Response } from '@ionaru/micro-web-service';
import * as proxy from 'http-proxy';
import { StatusCodes } from 'http-status-codes';

export abstract class ProxyRoute extends BaseRouter {

    public static createProxy(target: string): proxy {
        const createdProxy = proxy.createProxy({target});

        createdProxy.on('proxyReq', (proxyReq: ClientRequest, req: IncomingMessage) => {
            if (req.body && req.complete) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Type', 'application/json');
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        });

        return createdProxy;
    }

    protected proxyRequest(proxyServer: proxy, request: Request, response: Response): void {
        proxyServer.web(request, response, {}, (error) => {
            ProxyRoute.sendResponse(response, StatusCodes.INTERNAL_SERVER_ERROR, error.message, error);
        });
    }
}

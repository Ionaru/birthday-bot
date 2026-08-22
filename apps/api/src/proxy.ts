/**
 * The gateway's forwarding, on fetch.
 *
 * Replaces http-proxy and the ProxyRoute/StorageRoute/DiscordClientRoute trio. The
 * mount prefix is stripped before forwarding, which is what Express's `app.use`
 * did implicitly by rewriting req.url: `POST /storage` reaches storage as `POST /`,
 * and `GET /storage/{id}` as `GET /{id}`.
 */
import { type Debugger, type Handler, type RequestContext, sendServerError } from '@birthday-bot/common';

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

export const createProxyHandler = (target: string, log: Debugger): Handler => {
    const base = target.replace(/\/+$/, '');
    const debug = log.extend('proxy');

    return async ({ body, params, request, response }: RequestContext): Promise<void> => {
        const url = `${base}/${params['rest'] ?? ''}`;
        const method = request.method ?? 'GET';
        debug(`${method} ${url}`);

        let downstream: Response;
        try {
            downstream = await fetch(url, {
                body: body === undefined ? undefined : JSON.stringify(body),
                headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
                method,
            });
        } catch (error: unknown) {
            // A service that is still starting, or is down, would otherwise surface as
            // an unhandled rejection rather than a response.
            debug(`Upstream ${url} unreachable: ${String(error)}`);
            sendServerError(response, `Upstream request to ${url} failed`);
            return;
        }

        const text = await downstream.text();
        response.statusCode = downstream.status;
        response.setHeader('Content-Type', downstream.headers.get('content-type') ?? JSON_CONTENT_TYPE);
        response.setHeader('Content-Length', Buffer.byteLength(text));
        response.end(text);
    };
};

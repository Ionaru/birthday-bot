/**
 * The HTTP layer, on node:http.
 *
 * Replaces @ionaru/micro-web-service, express, ajv and http-status-codes. The three
 * services between them expose seven routes; that does not need a framework, but the
 * response envelope is a contract between them and has to stay exactly as it was:
 *
 *     { "data": ..., "message": "OK", "state": "success" }
 *
 * `data` is omitted when falsy, and the keys are written in that order because
 * JSON.stringify follows insertion order.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';

import { type Debugger } from './debug.ts';

const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

/** Every method the four services actually use, plus a catch-all for 405 fallbacks. */
export type HttpMethod = 'ALL' | 'DELETE' | 'GET' | 'POST';

export interface RequestContext {
    /** Parsed JSON body, or undefined when the request carried none. */
    readonly body: unknown;
    /** Values captured by `:name` segments, plus `rest` for a trailing `*`. */
    readonly params: Readonly<Record<string, string>>;
    readonly request: IncomingMessage;
    readonly response: ServerResponse;
}

export type Handler = (context: RequestContext) => Promise<void> | void;

export interface Route {
    readonly handler: Handler;
    readonly method: HttpMethod;
    /** `/`, `/:id`, or a prefix ending in `/*` which captures the remainder as `rest`. */
    readonly path: string;
}

export interface ServerResponseBody<T> {
    data?: T;
    message: string;
    state: string;
}

export const sendResponse = (
    response: ServerResponse,
    statusCode: number,
    message: string,
    data?: unknown,
): void => {
    const payload: ServerResponseBody<unknown> = {
        data,
        message,
        state: statusCode < 400 ? 'success' : 'error',
    };
    if (!data) {
        delete payload.data;
    }

    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    response.statusCode = statusCode;
    response.setHeader('Content-Type', JSON_CONTENT_TYPE);
    response.setHeader('Content-Length', body.length);
    response.end(body);
};

export const sendSuccess = (response: ServerResponse, data?: unknown): void =>
    sendResponse(response, 200, 'OK', data);

export const sendBadRequest = (response: ServerResponse, reason: string): void =>
    sendResponse(response, 400, 'Bad Request', { reason });

export const sendNotFound = (response: ServerResponse, url: string): void =>
    sendResponse(response, 404, 'Not Found', { url });

export const sendConflict = (response: ServerResponse, reason: string): void =>
    sendResponse(response, 409, 'Conflict', { reason });

export const sendMethodNotAllowed = (response: ServerResponse): void =>
    sendResponse(response, 405, 'Method Not Allowed');

export const sendServerError = (response: ServerResponse, reason: string): void =>
    sendResponse(response, 500, 'Internal Server Error', { reason });

/** Trailing slashes are insignificant, as they were under Express's router. */
export const normalisePath = (pathname: string): string => {
    const trimmed = pathname.replace(/\/+$/, '');
    return trimmed === '' ? '/' : trimmed;
};

/**
 * Matches one route pattern against a path.
 *
 * A pattern segment of `:name` captures that segment. A final `*` captures the whole
 * remainder as `rest`, which is what the API gateway forwards downstream. Returns
 * undefined when the pattern does not apply.
 */
export const matchPath = (pattern: string, pathname: string): Record<string, string> | undefined => {
    const patternParts = normalisePath(pattern).split('/');
    const pathParts = normalisePath(pathname).split('/');
    const params: Record<string, string> = {};

    for (const [index, part] of patternParts.entries()) {
        if (part === '*') {
            params['rest'] = pathParts.slice(index).join('/');
            return params;
        }
        if (index >= pathParts.length) {
            return undefined;
        }
        if (part.startsWith(':')) {
            params[part.slice(1)] = decodeURIComponent(pathParts[index]);
            continue;
        }
        if (part !== pathParts[index]) {
            return undefined;
        }
    }

    return patternParts.length === pathParts.length ? params : undefined;
};

/** Collects the request body, rejecting anything implausibly large for these APIs. */
const readBody = async (request: IncomingMessage): Promise<Buffer> => {
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of request) {
        const buffer = chunk as Buffer;
        length += buffer.length;
        if (length > 1_000_000) {
            throw new Error('Request body too large');
        }
        chunks.push(buffer);
    }
    return Buffer.concat(chunks);
};

export const createHttpServer = (routes: readonly Route[], log: Debugger): Server => {
    const debug = log.extend('http');

    return createServer((request, response) => {
        void (async () => {
            const originalUrl = request.url ?? '/';
            const { pathname } = new URL(originalUrl, 'http://localhost');
            const method = (request.method ?? 'GET').toUpperCase();

            let matched: { params: Record<string, string>; route: Route } | undefined;
            let pathExists = false;

            for (const route of routes) {
                const params = matchPath(route.path, pathname);
                if (!params) {
                    continue;
                }
                pathExists = true;
                if (route.method === 'ALL' || route.method === method) {
                    matched = { params, route };
                    break;
                }
            }

            if (!matched) {
                debug(`${method} ${originalUrl} -> ${pathExists ? 405 : 404}`);
                if (pathExists) {
                    sendMethodNotAllowed(response);
                } else {
                    sendNotFound(response, originalUrl);
                }
                return;
            }

            const raw = await readBody(request);
            let body: unknown;
            if (raw.length > 0) {
                try {
                    body = JSON.parse(raw.toString('utf8'));
                } catch {
                    debug(`${method} ${originalUrl} -> 400 (malformed JSON)`);
                    sendBadRequest(response, 'Malformed JSON body');
                    return;
                }
            }

            debug(`${method} ${originalUrl}`);
            await matched.route.handler({ body, params: matched.params, request, response });
        })().catch((error: unknown) => {
            process.stderr.write(`Unhandled route error: ${String(error)}\n`);
            if (!response.headersSent) {
                sendServerError(response, 'Unhandled route error');
            }
        });
    });
};

export const listen = (server: Server, port: number): Promise<void> =>
    new Promise((resolve, reject) => {
        const onError = (error: Error): void => {
            reject(error);
        };
        server.once('error', onError);
        server.listen(port, () => {
            server.off('error', onError);
            resolve();
        });
    });

export const close = (server: Server): Promise<void> =>
    new Promise((resolve, reject) => {
        // Without this, close() waits for keep-alive connections that never end.
        server.closeAllConnections();
        server.close((error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });

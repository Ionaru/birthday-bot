/**
 * The client half of the inter-service HTTP calls, on fetch.
 *
 * Replaces ApiClientController and axios. Errors are returned as a status rather
 * than thrown, because every caller already branched on 404 and 409.
 */
import { type Debugger } from './debug.ts';
import { type ServerResponseBody } from './http-server.ts';

export interface ApiResult<T> {
    readonly data: T | undefined;
    readonly ok: boolean;
    readonly status: number;
}

export class ApiClient {

    private readonly baseUrl: string;
    private readonly debug: Debugger;

    public constructor(baseUrl: string, log: Debugger) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        this.debug = log.extend('ApiClient');
        this.debug(`Base URL: ${this.baseUrl}`);
    }

    public async request<T>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
        const url = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
        this.debug(`${method} ${url}`);

        const response = await fetch(url, {
            body: body === undefined ? undefined : JSON.stringify(body),
            headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
            method,
        });

        let payload: ServerResponseBody<T> | undefined;
        const text = await response.text();
        if (text.length > 0) {
            try {
                payload = JSON.parse(text) as ServerResponseBody<T>;
            } catch {
                this.debug(`Response from ${url} was not JSON`);
            }
        }

        return { data: payload?.data, ok: response.ok, status: response.status };
    }
}

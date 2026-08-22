import assert from 'node:assert/strict';
import { type AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

import { createDebug } from './debug.ts';
import { close, createHttpServer, listen, matchPath, normalisePath,
    type Route, sendSuccess } from './http-server.ts';

const silent = createDebug('test');

describe('normalisePath', () => {
    it('drops trailing slashes but keeps the root', () => {
        assert.equal(normalisePath('/storage/'), '/storage');
        assert.equal(normalisePath('/storage///'), '/storage');
        assert.equal(normalisePath('/'), '/');
        assert.equal(normalisePath(''), '/');
    });
});

describe('matchPath', () => {
    it('matches a literal path', () => {
        assert.deepEqual(matchPath('/', '/'), {});
        assert.equal(matchPath('/', '/other'), undefined);
    });

    it('captures a named parameter', () => {
        assert.deepEqual(matchPath('/:id', '/abc'), { id: 'abc' });
        assert.deepEqual(matchPath('/:id', '/123:456'), { id: '123:456' });
    });

    it('decodes a percent-encoded parameter', () => {
        assert.deepEqual(matchPath('/:id', '/a%3Ab'), { id: 'a:b' });
    });

    it('does not let a parameter swallow extra segments', () => {
        assert.equal(matchPath('/:id', '/a/b'), undefined);
    });

    it('captures the remainder behind a wildcard', () => {
        assert.deepEqual(matchPath('/storage/*', '/storage/abc/def'), { rest: 'abc/def' });
        // The bare prefix must match too: POST /storage forwards as POST /.
        assert.deepEqual(matchPath('/storage/*', '/storage'), { rest: '' });
        assert.equal(matchPath('/storage/*', '/other'), undefined);
    });
});

describe('the HTTP server', () => {
    let baseUrl: string;
    let server: ReturnType<typeof createHttpServer>;

    // Order matters: the first route whose path and method both match wins, as it
    // did under Express's router. Hence /explode ahead of the /:id catch-all.
    const routes: Route[] = [
        { handler: ({ response }) => { sendSuccess(response, { hello: 'world' }); }, method: 'GET', path: '/' },
        { handler: ({ body, response }) => { sendSuccess(response, body); }, method: 'POST', path: '/' },
        { handler: () => { throw new Error('boom'); }, method: 'GET', path: '/explode' },
        { handler: ({ params, response }) => { sendSuccess(response, params); }, method: 'GET', path: '/:id' },
    ];

    before(async () => {
        server = createHttpServer(routes, silent);
        await listen(server, 0);
        baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });

    after(async () => {
        await close(server);
    });

    it('wraps the payload in the envelope', async () => {
        const response = await fetch(`${baseUrl}/`);
        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {
            data: { hello: 'world' },
            message: 'OK',
            state: 'success',
        });
    });

    it('omits data when there is none', async () => {
        const server2 = createHttpServer(
            [{ handler: ({ response }) => { sendSuccess(response); }, method: 'GET', path: '/' }],
            silent,
        );
        await listen(server2, 0);
        const port = (server2.address() as AddressInfo).port;
        const body = await (await fetch(`http://127.0.0.1:${port}/`)).json();
        assert.deepEqual(body, { message: 'OK', state: 'success' });
        await close(server2);
    });

    it('parses a JSON body', async () => {
        const response = await fetch(`${baseUrl}/`, {
            body: JSON.stringify({ a: 1 }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
        assert.deepEqual((await response.json() as { data: unknown }).data, { a: 1 });
    });

    it('answers 400 for a malformed JSON body', async () => {
        const response = await fetch(`${baseUrl}/`, { body: '{oh no', method: 'POST' });
        assert.equal(response.status, 400);
        assert.equal((await response.json() as { state: string }).state, 'error');
    });

    it('answers 404 for an unknown path', async () => {
        const response = await fetch(`${baseUrl}/a/b/c`);
        assert.equal(response.status, 404);
    });

    it('answers 405 when the path exists but the method does not', async () => {
        const response = await fetch(`${baseUrl}/`, { method: 'DELETE' });
        assert.equal(response.status, 405);
    });

    it('turns a throwing handler into a 500 rather than a hang', async () => {
        const response = await fetch(`${baseUrl}/explode`);
        assert.equal(response.status, 500);
    });

    it('gives the first matching route priority over a later parameter route', async () => {
        const response = await fetch(`${baseUrl}/explode`);
        assert.equal(response.status, 500);
    });

    it('ignores a trailing slash', async () => {
        const response = await fetch(`${baseUrl}/abc/`);
        assert.deepEqual((await response.json() as { data: unknown }).data, { id: 'abc' });
    });
});

/**
 * A minimal stand-in for the `debug` package.
 *
 * The README documents `DEBUG=birthday-bot*` as a supported environment variable, so
 * the namespace syntax has to keep working: comma or whitespace separated patterns,
 * `*` as a wildcard, and a leading `-` to exclude. `util.debuglog` reads NODE_DEBUG
 * instead and could not honour that contract.
 *
 * Output matches what `debug` writes when stderr is not a TTY, which is the only
 * form that ever reaches the container logs:
 *
 *     2026-08-22T18:00:00.000Z birthday-bot:storage:BirthdayService: 3 birthdays
 *
 * The TTY colour variant is not reproduced; it is cosmetic and never used in
 * production.
 */
import { format } from 'node:util';

export interface Debugger {
    (...args: unknown[]): void;
    extend: (namespace: string) => Debugger;
    readonly namespace: string;
}

/** Matches a namespace against one pattern, treating `*` as "any run of characters". */
const matches = (namespace: string, pattern: string): boolean => {
    const parts = pattern.split('*');
    if (parts.length === 1) {
        return namespace === pattern;
    }
    if (!namespace.startsWith(parts[0])) {
        return false;
    }
    const last = parts.at(-1) as string;
    if (!namespace.endsWith(last)) {
        return false;
    }
    let index = parts[0].length;
    for (const part of parts.slice(1, -1)) {
        const found = namespace.indexOf(part, index);
        if (found === -1) {
            return false;
        }
        index = found + part.length;
    }
    return index <= namespace.length - last.length;
};

const patterns = (process.env['DEBUG'] ?? '')
    .trim()
    .replaceAll(/\s+/g, ',')
    .split(',')
    .filter(Boolean);

const names = patterns.filter((p) => !p.startsWith('-'));
const skips = patterns.filter((p) => p.startsWith('-')).map((p) => p.slice(1));

const enabled = (namespace: string): boolean =>
    !skips.some((pattern) => matches(namespace, pattern))
    && names.some((pattern) => matches(namespace, pattern));

export const createDebug = (namespace: string): Debugger => {
    const on = enabled(namespace);
    const log = (...args: unknown[]): void => {
        if (on) {
            process.stderr.write(`${new Date().toISOString()} ${namespace} ${format(...args)}\n`);
        }
    };
    return Object.assign(log, {
        extend: (child: string) => createDebug(`${namespace}:${child}`),
        namespace,
    });
};

/** Every service extends this, so one `DEBUG=birthday-bot*` turns the whole stack on. */
export const debug = createDebug('birthday-bot');

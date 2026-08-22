/**
 * Process lifecycle.
 *
 * Replaces handleExceptions and handleSignals from @ionaru/micro-web-service. All
 * four services register the same handlers, so `stop` runs once, whichever way the
 * process is going down.
 */
import { format } from 'node:util';

import { type Debugger } from './debug.ts';

export type StopFunction = () => Promise<void> | void;

export const handleShutdown = (stop: StopFunction, log: Debugger): void => {
    const debug = log.extend('lifecycle');
    let stopping = false;

    const shutdown = (code: number): void => {
        if (stopping) {
            return;
        }
        stopping = true;

        void Promise.resolve(stop())
            .catch((error: unknown) => {
                process.stderr.write(`Error while stopping: ${format(error)}\n`);
            })
            .finally(() => {
                debug('Bye bye!');
                process.exit(code);
            });
    };

    process.on('unhandledRejection', (reason, promise) => {
        process.stderr.write(`Unhandled Rejection at: \nPromise ${format(promise)} \nReason: ${format(reason)}\n`);
    });
    process.on('uncaughtException', (error) => {
        process.stderr.write(`Uncaught Exception! \n${format(error)}\n`);
        shutdown(1);
    });
    process.on('SIGINT', () => {
        debug('SIGINT received.');
        shutdown(0);
    });
    process.on('SIGTERM', () => {
        debug('SIGTERM received.');
        shutdown(0);
    });
};

/** Reports a failure during startup and exits, the tail every service's index.ts has. */
export const failFast = (error: unknown): never => {
    process.stderr.write(`${format(error)}\n`);
    process.exit(1);
};

import { IRoute, ServiceController } from '@ionaru/micro-web-service';

import { debug } from '../../debug';

export class ServerController {
    private static readonly debug = debug.extend('ServerController');

    private readonly serviceController: ServiceController;

    public constructor(routes: IRoute[]) {
        ServerController.debug('Start');

        const port = Number(process.env.BB_DISCORD_CLIENT_PORT) || 3000;

        if (isNaN(port)) {
            throw new Error('Server configuration error!');
        }

        ServerController.debug('Configuration OK');

        this.serviceController = new ServiceController({
            debug: ServerController.debug,
            port,
            routes,
        });

        ServerController.debug('Ready');
    }

    public async init(): Promise<void> {
        ServerController.debug('Init');
        await this.serviceController.listen();
    }

    public async stop(): Promise<void> {
        ServerController.debug('Stop');
        await this.serviceController.close();
        ServerController.debug('Server closed');
    }
}

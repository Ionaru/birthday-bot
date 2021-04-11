import { IRoute, ServiceController } from '@ionaru/micro-web-service';
import { Debugger } from 'debug';

export class ServerController {

    private readonly debug: Debugger;
    private readonly serviceController: ServiceController;

    public constructor(routes: IRoute[], debug: Debugger, portEnv?: string) {
        this.debug = debug.extend(this.constructor.name);
        this.debug('Start');

        const port = Number(portEnv) || 3000;

        if (isNaN(port)) {
            throw new Error('Server configuration error!');
        }

        this.debug('Configuration OK');

        this.serviceController = new ServiceController({
            debug: this.debug,
            port,
            routes,
        });

        this.debug('Ready');
    }

    public async init(): Promise<void> {
        this.debug('Init');
        await this.serviceController.listen();
    }

    public async stop(): Promise<void> {
        this.debug('Stop');
        await this.serviceController.close();
        this.debug('Server closed');
    }
}

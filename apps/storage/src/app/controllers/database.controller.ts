import { Birthday } from '@birthday-bot/entities';
import { QueryLogger } from '@ionaru/typeorm-utils';
import { createConnection, EntityMetadata, getConnection, getConnectionOptions } from 'typeorm';

import { debug } from '../../debug';

export class DatabaseController {
    private static readonly debug = debug.extend('DatabaseController');

    public constructor() {
        DatabaseController.debug('Start');
        DatabaseController.debug('Configuration OK');
        DatabaseController.debug('Ready');
    }

    public async init(): Promise<void> {
        DatabaseController.debug('Init');

        const connectionOptions = await getConnectionOptions('storage');

        Object.assign(connectionOptions, {
            entities: [Birthday],
            logger: new QueryLogger(debug),
            logging: ['query', 'error'],
            name: 'default',
        });

        const connection = await createConnection(connectionOptions);

        DatabaseController.debug(`Database: ${connection.driver.database}`);
        DatabaseController.debug(
            `Entities: ${connection.entityMetadatas
                .map((entity: EntityMetadata) => entity.name)
                .join(', ')}`,
        );
    }

    public async stop(): Promise<void> {
        DatabaseController.debug('Stop');
        const connection = getConnection();
        if (connection.isConnected) {
            await connection.close();
        }
        DatabaseController.debug('Connection closed');
    }
}

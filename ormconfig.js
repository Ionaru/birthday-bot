/**
 * @file Manages the configuration settings for TypeORM.
 */
const {join} = require('path');

const buildConnectionOptions = (
    {
        moduleName,
        database,
        timezone = 'Z',
        models = []
    }
) => {

    const runningMigration = process.argv.length >= 3 && process.argv[2].includes('migration');

    const connectionOptions = {
        database,
        timezone,
        type: 'sqlite',
        name: moduleName,
    };

    const mapper = (model) => join(__dirname, 'dist', 'out-tsc', 'libs', 'entities', 'src', 'lib', `${model}.js`);
    connectionOptions.entities = runningMigration ? models.map(mapper) : [];

    if (runningMigration) {
        const migrationsDir = `apps/${moduleName}/migrations`;
        connectionOptions.cli = {
            migrationsDir,
        };
        connectionOptions.migrations = [`${migrationsDir}/*.ts`];
        connectionOptions.migrationsTableName = 'migrations';
    }

    return connectionOptions;
};

module.exports = [
    buildConnectionOptions({
        moduleName: 'storage',
        database: process.env.BB_STORAGE_DB_NAME,
        models: [
            'birthday',
        ],
    }),
];

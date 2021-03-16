import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1615834291131 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "birthday"
                                 (
                                     "id"        varchar PRIMARY KEY NOT NULL,
                                     "createdOn" datetime            NOT NULL DEFAULT (datetime('now')),
                                     "updatedOn" datetime            NOT NULL DEFAULT (datetime('now')),
                                     "deletedOn" datetime,
                                     "user"      varchar             NOT NULL,
                                     "channel"   varchar             NOT NULL,
                                     "birthday"  varchar             NOT NULL,
                                     CONSTRAINT "UQ_78396a99fe013dab3be0c6670cd" UNIQUE ("user", "channel")
                                 )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "birthday"`);
    }

}

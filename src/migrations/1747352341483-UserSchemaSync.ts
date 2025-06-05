import { MigrationInterface, QueryRunner } from "typeorm";

export class UserSchemaSync1747352341483 implements MigrationInterface {
    name = 'UserSchemaSync1747352341483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`secondaryBoardIdAsRecruit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`secondaryBoardLevelIdAsRecruit\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`secondaryPositionAsRecruit\` varchar(50) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`secondaryPositionAsRecruit\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`secondaryBoardLevelIdAsRecruit\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`secondaryBoardIdAsRecruit\``);
    }

}

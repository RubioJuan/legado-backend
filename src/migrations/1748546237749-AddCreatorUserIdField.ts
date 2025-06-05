import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatorUserIdField1748546237749 implements MigrationInterface {
    name = 'AddCreatorUserIdField1748546237749'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_8b4a7dee1bff5367e2d0e6b7e3d\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_8b4a7dee1bff5367e2d0e6b7e3d\` FOREIGN KEY (\`creatorUserId\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFieldsToUser1747149663742 implements MigrationInterface {
    name = 'AddPasswordResetFieldsToUser1747149663742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`FK_0c47034a861e4157e15c9549a5d\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_0e834ca5be7f3fc0aa763e61c16\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_238c9e727fd83a2df91d575965f\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_24880f4a84465a2c02e2324aa9a\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_36cb991f0242a6b62f86db6f214\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_5086fafd058e8c90cdd47cb8b11\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_5a0935cdd6e5637530327801a6f\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_686637586cf7ae7e7eaf05c39dc\` ON \`board\``);
        await queryRunner.query(`DROP INDEX \`FK_6f27634e9e3658c198297960252\` ON \`board\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`passwordResetToken\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`passwordResetExpires\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`passwordResetExpires\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`passwordResetToken\``);
        await queryRunner.query(`CREATE INDEX \`FK_6f27634e9e3658c198297960252\` ON \`board\` (\`idBoardState\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_686637586cf7ae7e7eaf05c39dc\` ON \`board\` (\`idGenerator4\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_5a0935cdd6e5637530327801a6f\` ON \`board\` (\`idGenerator2\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_5086fafd058e8c90cdd47cb8b11\` ON \`board\` (\`idDefender4\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_36cb991f0242a6b62f86db6f214\` ON \`board\` (\`idGenerator1\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_24880f4a84465a2c02e2324aa9a\` ON \`board\` (\`idGenerator3\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_238c9e727fd83a2df91d575965f\` ON \`board\` (\`idGoalScorer\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_0e834ca5be7f3fc0aa763e61c16\` ON \`board\` (\`idCreator2\`)`);
        await queryRunner.query(`CREATE INDEX \`FK_0c47034a861e4157e15c9549a5d\` ON \`board\` (\`idCreator1\`)`);
    }

}

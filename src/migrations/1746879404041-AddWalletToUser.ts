import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWalletToUser1746879404041 implements MigrationInterface {
    name = 'AddWalletToUser1746879404041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_0c47034a861e4157e15c9549a5d\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_0e834ca5be7f3fc0aa763e61c16\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_238c9e727fd83a2df91d575965f\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_24880f4a84465a2c02e2324aa9a\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_36cb991f0242a6b62f86db6f214\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_5086fafd058e8c90cdd47cb8b11\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_5a0935cdd6e5637530327801a6f\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_686637586cf7ae7e7eaf05c39dc\``);
        await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_6f27634e9e3658c198297960252\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`wallet\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_ff8aa4015963ebb386ecdbcb0c5\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e129d608c2ce087feffb17b024f\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e92c89502b355c60289e4cf8818\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idUserProcessState\` \`idUserProcessState\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idRole\` \`idRole\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idUserState\` \`idUserState\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`board\` CHANGE \`idLevelId\` \`idLevelId\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_e129d608c2ce087feffb17b024f\` FOREIGN KEY (\`idRole\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_e92c89502b355c60289e4cf8818\` FOREIGN KEY (\`idUserState\`) REFERENCES \`user_state\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_ff8aa4015963ebb386ecdbcb0c5\` FOREIGN KEY (\`idUserProcessState\`) REFERENCES \`user_process_state\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_ff8aa4015963ebb386ecdbcb0c5\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e92c89502b355c60289e4cf8818\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e129d608c2ce087feffb17b024f\``);
        await queryRunner.query(`ALTER TABLE \`board\` CHANGE \`idLevelId\` \`idLevelId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idUserState\` \`idUserState\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idRole\` \`idRole\` int NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idUserProcessState\` \`idUserProcessState\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_e92c89502b355c60289e4cf8818\` FOREIGN KEY (\`idUserState\`) REFERENCES \`user_state\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_e129d608c2ce087feffb17b024f\` FOREIGN KEY (\`idRole\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_ff8aa4015963ebb386ecdbcb0c5\` FOREIGN KEY (\`idUserProcessState\`) REFERENCES \`user_process_state\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`wallet\``);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_6f27634e9e3658c198297960252\` FOREIGN KEY (\`idBoardState\`) REFERENCES \`board_state\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_686637586cf7ae7e7eaf05c39dc\` FOREIGN KEY (\`idGenerator4\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_5a0935cdd6e5637530327801a6f\` FOREIGN KEY (\`idGenerator2\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_5086fafd058e8c90cdd47cb8b11\` FOREIGN KEY (\`idDefender4\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_36cb991f0242a6b62f86db6f214\` FOREIGN KEY (\`idGenerator1\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_24880f4a84465a2c02e2324aa9a\` FOREIGN KEY (\`idGenerator3\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_238c9e727fd83a2df91d575965f\` FOREIGN KEY (\`idGoalScorer\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_0e834ca5be7f3fc0aa763e61c16\` FOREIGN KEY (\`idCreator2\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_0c47034a861e4157e15c9549a5d\` FOREIGN KEY (\`idCreator1\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}

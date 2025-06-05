import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBoardForGeneralPromotionAndRecruitSlotLogic1747615378636 implements MigrationInterface {
    name = 'UpdateBoardForGeneralPromotionAndRecruitSlotLogic1747615378636'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`DROP INDEX \`IDX_44abbebbc72bd7eb40ba6df6aa\` ON \`entity_user\``); // Comentado: El índice no existe
        // await queryRunner.query(`DROP INDEX \`IDX_8881a4be21d7dd833f50a64953\` ON \`entity_user\``); // Comentado: El índice no existe
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`canVerifyRecruits\` tinyint NOT NULL DEFAULT 1`); // ELIMINADA PREVIAMENTE
        await queryRunner.query(`ALTER TABLE \`board\` CHANGE \`isAwaitingUserCreation\` \`isAwaitingUserCreation\` tinyint NOT NULL DEFAULT 0`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD UNIQUE INDEX \`IDX_ca94f7bdeb65a99af46f3a19bb\` (\`username\`)`); // Comentado: El índice ya existe
        // await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_484060d0fffd00f70838ef108b1\` FOREIGN KEY (\`idLevelId\`) REFERENCES \`level\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`board\` ADD CONSTRAINT \`FK_6f27634e9e3658c198297960252\` FOREIGN KEY (\`idBoardState\`) REFERENCES \`board_state\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_8881a4be21d7dd833f50a64953c\` FOREIGN KEY (\`idLeftAssociation\`) REFERENCES \`associations\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_44abbebbc72bd7eb40ba6df6aa2\` FOREIGN KEY (\`idRightAssociation\`) REFERENCES \`associations\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        // await queryRunner.query(`
        //     CREATE TABLE \`general_awaiting_recruit_slot\` (
        //         \`id\` int NOT NULL AUTO_INCREMENT,
        //         \`userId\` int NOT NULL,
        //         \`primaryBoardId\` int NOT NULL,
        //         \`primaryLevelId\` int NOT NULL,
        //         \`targetRecruitLevelId\` int NOT NULL,
        //         \`reasonForWaiting\` enum (
        //             'HIGHER_RANK_SLOTS_EXIST_ON_TARGET',
        //             'NO_RECRUIT_SLOTS_ON_TARGET'
        //         ) NULL,
        //         \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        //         \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        //         PRIMARY KEY (\`id\`)
        //     ) ENGINE = InnoDB
        // `); // Comentado: La tabla ya existe
        // await queryRunner.query(`
        //     ALTER TABLE \`general_awaiting_recruit_slot\`
        //     ADD CONSTRAINT \`FK_general_awaiting_slot_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        // `); // Comentado: La tabla ya existe, FK podría existir
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_44abbebbc72bd7eb40ba6df6aa2\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_8881a4be21d7dd833f50a64953c\``);
        // await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_6f27634e9e3658c198297960252\``);
        // await queryRunner.query(`ALTER TABLE \`board\` DROP FOREIGN KEY \`FK_484060d0fffd00f70838ef108b1\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP INDEX \`IDX_ca94f7bdeb65a99af46f3a19bb\``); // Comentado: El índice ya existía
        await queryRunner.query(`ALTER TABLE \`board\` CHANGE \`isAwaitingUserCreation\` \`isAwaitingUserCreation\` tinyint(1) NULL DEFAULT '0'`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`canVerifyRecruits\``); // ELIMINADA PREVIAMENTE
        // await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_8881a4be21d7dd833f50a64953\` ON \`entity_user\` (\`idLeftAssociation\`)`); // Comentado: El índice no existía para eliminarse en up
        // await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_44abbebbc72bd7eb40ba6df6aa\` ON \`entity_user\` (\`idRightAssociation\`)`); // Comentado: El índice no existía para eliminarse en up
        // await queryRunner.query(`
        //     ALTER TABLE \`general_awaiting_recruit_slot\` DROP FOREIGN KEY \`FK_general_awaiting_slot_userId\`
        // `); // Comentado: La tabla ya existe
        // await queryRunner.query(`
        //     DROP TABLE \`general_awaiting_recruit_slot\`
        // `); // Comentado: La tabla ya existe
    }

}

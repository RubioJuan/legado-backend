import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatorUserIdField1748533723642 implements MigrationInterface {
    name = 'AddCreatorUserIdField1748533723642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`creatorUserId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`canVerifyRecruits\` \`canVerifyRecruits\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD UNIQUE INDEX \`IDX_ecf8ae68a4f34da37938f301bc\` (\`userId\`)`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP COLUMN \`reasonForWaiting\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD \`reasonForWaiting\` enum ('HIGHER_RANK_SLOTS_EXIST_ON_TARGET', 'NO_RECRUIT_SLOTS_ON_TARGET') NULL`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`CREATE INDEX \`IDX_9bd367fbe2995fc039065769dc\` ON \`general_awaiting_recruit_slot\` (\`userId\`, \`targetRecruitLevelId\`)`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_8b4a7dee1bff5367e2d0e6b7e3d\` FOREIGN KEY (\`creatorUserId\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD CONSTRAINT \`FK_ecf8ae68a4f34da37938f301bcb\` FOREIGN KEY (\`userId\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD CONSTRAINT \`FK_08ddf251e9674345d331fcf6bec\` FOREIGN KEY (\`primaryBoardId\`) REFERENCES \`board\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD CONSTRAINT \`FK_5bdd122e3fb518b403454083692\` FOREIGN KEY (\`primaryLevelId\`) REFERENCES \`level\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD CONSTRAINT \`FK_4da5a1b80828046b11af4eff54b\` FOREIGN KEY (\`targetRecruitLevelId\`) REFERENCES \`level\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP FOREIGN KEY \`FK_4da5a1b80828046b11af4eff54b\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP FOREIGN KEY \`FK_5bdd122e3fb518b403454083692\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP FOREIGN KEY \`FK_08ddf251e9674345d331fcf6bec\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP FOREIGN KEY \`FK_ecf8ae68a4f34da37938f301bcb\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_8b4a7dee1bff5367e2d0e6b7e3d\``);
        await queryRunner.query(`DROP INDEX \`IDX_9bd367fbe2995fc039065769dc\` ON \`general_awaiting_recruit_slot\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP COLUMN \`updatedAt\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD \`updatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP COLUMN \`createdAt\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP COLUMN \`reasonForWaiting\``);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` ADD \`reasonForWaiting\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`general_awaiting_recruit_slot\` DROP INDEX \`IDX_ecf8ae68a4f34da37938f301bc\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`canVerifyRecruits\` \`canVerifyRecruits\` tinyint(1) NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`creatorUserId\``);
    }

}

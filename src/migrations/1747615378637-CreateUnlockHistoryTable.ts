import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUnlockHistoryTable1747615378637 implements MigrationInterface {
    name = 'CreateUnlockHistoryTable1747615378637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`unlock_history\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`idBoard\` int NOT NULL,
                \`idUser\` int NOT NULL,
                \`unlockedBy\` int NOT NULL,
                \`unlockType\` enum('PARTIAL', 'FULL') NOT NULL,
                \`unlockedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                KEY \`FK_unlock_history_board\` (\`idBoard\`),
                KEY \`FK_unlock_history_user\` (\`idUser\`),
                KEY \`FK_unlock_history_unlockedBy\` (\`unlockedBy\`),
                CONSTRAINT \`FK_unlock_history_board\` FOREIGN KEY (\`idBoard\`) REFERENCES \`board\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_unlock_history_user\` FOREIGN KEY (\`idUser\`) REFERENCES \`entity_user\` (\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_unlock_history_unlockedBy\` FOREIGN KEY (\`unlockedBy\`) REFERENCES \`entity_user\` (\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`unlock_history\``);
    }
} 
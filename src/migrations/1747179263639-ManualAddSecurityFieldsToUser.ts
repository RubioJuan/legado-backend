import { MigrationInterface, QueryRunner } from "typeorm";

export class ManualAddSecurityFieldsToUser1747179263639 implements MigrationInterface {
    name = 'ManualAddSecurityFieldsToUser1747179263639'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`securityQuestion\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`securityAnswerHash\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`failedSecurityAttempts\` int NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`securityLockoutUntil\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columnsToDrop = [
            'securityLockoutUntil',
            'failedSecurityAttempts',
            'securityAnswerHash',
            'securityQuestion'
        ];
        for (const column of columnsToDrop) {
            try {
                await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`${column}\``);
            } catch (error: any) {
                if (error.message.includes("Unknown column") || error.message.includes("Can't DROP")) {
                    console.warn(`Column '${column}' not found or could not be dropped, no action taken.`);
                } else {
                    throw error;
                }
            }
        }
    }

}

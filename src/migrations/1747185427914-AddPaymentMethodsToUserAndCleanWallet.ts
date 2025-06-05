import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentMethodsToUserAndCleanWallet1747185427914 implements MigrationInterface {
    name = 'AddPaymentMethodsToUserAndCleanWallet1747185427914'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`paymentMethods\` json NULL`);
        
        try {
            await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`wallet\``);
        } catch (error: any) {
            if (error.message.includes("Unknown column 'wallet'") || error.message.includes("Can't DROP 'wallet'; check that column/key exists")) {
                console.warn("'wallet' column not found in 'entity_user' table or could not be dropped, no action taken by this specific DROP command.");
            } else {
                throw error;
            }
        }

        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`ballsReceivedConfirmed\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`ballsReceivedConfirmed\` int NOT NULL DEFAULT '0'`);
        
        await queryRunner.query(`ALTER TABLE \`subscriptions\` MODIFY COLUMN \`idSubscriptionState\` int NULL`);

        await queryRunner.query(`ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_d572f98f8e82e066ca27ae6d2ed\` FOREIGN KEY (\`idSubscriptionState\`) REFERENCES \`subscription_state\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` ADD CONSTRAINT \`FK_bd289af0ff45ff82e573a9e0f05\` FOREIGN KEY (\`idUser\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_bd289af0ff45ff82e573a9e0f05\``);
        await queryRunner.query(`ALTER TABLE \`subscriptions\` DROP FOREIGN KEY \`FK_d572f98f8e82e066ca27ae6d2ed\``);

        await queryRunner.query(`ALTER TABLE \`subscriptions\` MODIFY COLUMN \`idSubscriptionState\` int NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`ballsReceivedConfirmed\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`ballsReceivedConfirmed\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`paymentMethods\``);

        try {
            await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`wallet\` varchar(255) NULL`);
        } catch (error: any) {
            if (error.message.includes("Duplicate column name 'wallet'")) {
                 console.warn("'wallet' column already exists in 'entity_user' table, no action taken by this specific ADD command during down migration.");
            } else {
                throw error;
            }
        }
    }

}

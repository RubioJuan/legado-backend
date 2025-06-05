import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUnlockCountValues1710286800003 implements MigrationInterface {
    name = 'UpdateUnlockCountValues1710286800003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Actualizar los valores existentes basados en el estado actual
        await queryRunner.query(`
            UPDATE entity_user
            SET unlockCount = CASE
                WHEN idUserProcessState = 1 THEN 0  -- WAITING
                WHEN idUserProcessState = 3 THEN 1  -- VALIDATING
                WHEN idUserProcessState = 5 THEN 2  -- READY_TO_ACCEPT
                WHEN idUserProcessState = 4 THEN 2  -- VALIDATED
                ELSE 0
            END;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No es necesario revertir esta migración ya que solo actualiza valores
    }
} 
import { MigrationInterface, QueryRunner } from "typeorm";

export class EnsureUnlockCountColumn1710286800004 implements MigrationInterface {
    name = 'EnsureUnlockCountColumn1710286800004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar si la columna existe
        const hasColumn = await queryRunner.hasColumn('entity_user', 'unlockCount');
        
        if (!hasColumn) {
            // Si no existe, la creamos
            await queryRunner.query(`
                ALTER TABLE entity_user
                ADD COLUMN unlockCount INT NOT NULL DEFAULT 0
            `);
        }

        // Actualizar los valores existentes basados en el estado actual
        await queryRunner.query(`
            UPDATE entity_user
            SET unlockCount = CASE
                WHEN idUserProcessState = 1 THEN 0  -- WAITING
                WHEN idUserProcessState = 3 THEN 1  -- VALIDATING
                WHEN idUserProcessState = 5 THEN 2  -- READY_TO_ACCEPT
                WHEN idUserProcessState = 4 THEN 2  -- VALIDATED
                ELSE 0
            END
            WHERE unlockCount = 0;  -- Solo actualizar si el contador está en 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No hacemos nada en down ya que no queremos perder la información
    }
} 
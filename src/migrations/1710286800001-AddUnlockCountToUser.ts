import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUnlockCountToUser1710286800001 implements MigrationInterface {
    name = 'AddUnlockCountToUser1710286800001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar la columna unlockCount
        await queryRunner.addColumn(
            "entity_user",
            new TableColumn({
                name: "unlockCount",
                type: "int",
                default: 0,
                isNullable: false,
            })
        );

        // Actualizar los valores existentes basados en el estado actual
        await queryRunner.query(`
            UPDATE entity_user
            SET unlockCount = CASE
                WHEN idUserProcessState = 1 THEN 0  -- WAITING
                WHEN idUserProcessState = 3 THEN 1  -- VALIDATING
                WHEN idUserProcessState = 5 THEN 2  -- READY_TO_ACCEPT
                ELSE 0
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Eliminar la columna unlockCount
        await queryRunner.dropColumn("entity_user", "unlockCount");
    }
} 
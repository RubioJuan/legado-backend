import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddUnlockCountToUser1710286800002 implements MigrationInterface {
    name = 'AddUnlockCountToUser1710286800002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar si la columna ya existe
        const table = await queryRunner.getTable("entity_user");
        const hasUnlockCount = table?.findColumnByName("unlockCount");

        if (!hasUnlockCount) {
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
                    WHEN idUserProcessState = 4 THEN 2  -- VALIDATED
                    ELSE 0
                END;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Verificar si la columna existe antes de intentar eliminarla
        const table = await queryRunner.getTable("entity_user");
        const hasUnlockCount = table?.findColumnByName("unlockCount");

        if (hasUnlockCount) {
            await queryRunner.dropColumn("entity_user", "unlockCount");
        }
    }
} 
import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCanVerifyRecruitsToUser1678886500000 implements MigrationInterface { // Asegúrate que el timestamp coincida
    name = 'AddCanVerifyRecruitsToUser1678886500000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "entity_user", // Asegúrate que el nombre de tu tabla de usuarios sea "entity_user"
            new TableColumn({
                name: "canVerifyRecruits",
                type: "boolean",
                default: true, // Por defecto, un usuario puede verificar
                isNullable: false,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("entity_user", "canVerifyRecruits");
    }

} 
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAuditForeignKeysToEntityUser1747229161483 implements MigrationInterface {
    name = 'UpdateAuditForeignKeysToEntityUser1747229161483'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_7b589881a606e3eb0f54e543445\``);
        // await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_9599cbaf2f1561bf596ae1d84bb\``);
        // await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_b58e011f9e1e2f2ce2061db579c\``);
        // await queryRunner.query(`ALTER TABLE \`tail\` DROP FOREIGN KEY \`FK_eacf61d0343fae44cb1151308c6\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_44abbebbc72bd7eb40ba6df6aa2\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_8881a4be21d7dd833f50a64953c\``);
        //await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_bacac29c16500f295cdb59d2b1a\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e129d608c2ce087feffb17b024f\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e92c89502b355c60289e4cf8818\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_fdcfc5e53d52ee18ce7f5324b9b\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_ff8aa4015963ebb386ecdbcb0c5\``);
        // await queryRunner.query(`ALTER TABLE \`audit\` DROP FOREIGN KEY \`FK_2e92a677d5a5f369e90f1361d92\``);
        // await queryRunner.query(`ALTER TABLE \`audit\` DROP FOREIGN KEY \`FK_99e4fbe117f3219985c0901757d\``);
        await queryRunner.query(`ALTER TABLE \`subscription\` CHANGE \`idSubscriptionState\` \`idSubscriptionState\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`subscription\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`subscription\` ADD \`createAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`subscription\` DROP COLUMN \`updateAt\``);
        await queryRunner.query(`ALTER TABLE \`subscription\` ADD \`updateAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`tail\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`tail\` ADD \`createAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`tail\` DROP COLUMN \`updateAt\``);
        await queryRunner.query(`ALTER TABLE \`tail\` ADD \`updateAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        // await queryRunner.query(`DROP INDEX \`IDX_ca94f7bdeb65a99af46f3a19bb\` ON \`entity_user\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`username\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`username\` varchar(50) NOT NULL`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD UNIQUE INDEX \`IDX_ca94f7bdeb65a99af46f3a19bb\` (\`username\`)`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`password\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`firstName\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`firstName\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`lastName\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`lastName\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`country\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`country\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`countryCode\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`countryCode\` varchar(10) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`phoneNumber\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`phoneNumber\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedNames\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedNames\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedPhoneNumber\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedPhoneNumber\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedCountry\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedCountry\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedCountryCode\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedCountryCode\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`acceptMarketing\` \`acceptMarketing\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`createAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`updateAt\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`updateAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD UNIQUE INDEX \`IDX_8881a4be21d7dd833f50a64953\` (\`idLeftAssociation\`)`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD UNIQUE INDEX \`IDX_44abbebbc72bd7eb40ba6df6aa\` (\`idRightAssociation\`)`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idUserProcessState\` \`idUserProcessState\` int NULL`);
        // await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_eacf61d0343fae44cb1151308c\` ON \`tail\` (\`idUser\`)`);
        // await queryRunner.query(`CREATE UNIQUE INDEX \`REL_8881a4be21d7dd833f50a64953\` ON \`entity_user\` (\`idLeftAssociation\`)`);
        // await queryRunner.query(`CREATE UNIQUE INDEX \`REL_44abbebbc72bd7eb40ba6df6aa\` ON \`entity_user\` (\`idRightAssociation\`)`);
        // await queryRunner.query(`ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_9599cbaf2f1561bf596ae1d84bb\` FOREIGN KEY (\`idBoard\`) REFERENCES \`board\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_7b589881a606e3eb0f54e543445\` FOREIGN KEY (\`idSubscriptionState\`) REFERENCES \`subscription_state\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`subscription\` ADD CONSTRAINT \`FK_b58e011f9e1e2f2ce2061db579c\` FOREIGN KEY (\`idUser\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`tail\` ADD CONSTRAINT \`FK_eacf61d0343fae44cb1151308c6\` FOREIGN KEY (\`idUser\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_e129d608c2ce087feffb17b024f\` FOREIGN KEY (\`idRole\`) REFERENCES \`role\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_e92c89502b355c60289e4cf8818\` FOREIGN KEY (\`idUserState\`) REFERENCES \`user_state\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_8881a4be21d7dd833f50a64953c\` FOREIGN KEY (\`idLeftAssociation\`) REFERENCES \`associations\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_ff8aa4015963ebb386ecdbcb0c5\` FOREIGN KEY (\`idUserProcessState\`) REFERENCES \`user_process_state\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_fdcfc5e53d52ee18ce7f5324b9b\` FOREIGN KEY (\`idCaptain\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD CONSTRAINT \`FK_bacac29c16500f295cdb59d2b1a\` FOREIGN KEY (\`triplicationOfId\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`audit\` ADD CONSTRAINT \`FK_2e92a677d5a5f369e90f1361d92\` FOREIGN KEY (\`idUserExecutor\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`audit\` ADD CONSTRAINT \`FK_99e4fbe117f3219985c0901757d\` FOREIGN KEY (\`idUserModificated\`) REFERENCES \`entity_user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Comentados por errores previos o porque su contraparte en 'up' está comentada:
        // await queryRunner.query(`ALTER TABLE \`audit\` DROP FOREIGN KEY \`FK_99e4fbe117f3219985c0901757d\``);
        // await queryRunner.query(`ALTER TABLE \`audit\` DROP FOREIGN KEY \`FK_2e92a677d5a5f369e90f1361d92\``);

        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_bacac29c16500f295cdb59d2b1a\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_fdcfc5e53d52ee18ce7f5324b9b\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_ff8aa4015963ebb386ecdbcb0c5\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_44abbebbc72bd7eb40ba6df6aa2\``); // Esta es la que causa el error actual en 'up', la comentaremos aquí también en el siguiente paso.
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_8881a4be21d7dd833f50a64953c\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e92c89502b355c60289e4cf8818\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP FOREIGN KEY \`FK_e129d608c2ce087feffb17b024f\``);

        // await queryRunner.query(`ALTER TABLE \`tail\` DROP FOREIGN KEY \`FK_eacf61d0343fae44cb1151308c6\``);

        // await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_b58e011f9e1e2f2ce2061db579c\``);
        // await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_7b589881a606e3eb0f54e543445\``);
        // await queryRunner.query(`ALTER TABLE \`subscription\` DROP FOREIGN KEY \`FK_9599cbaf2f1561bf596ae1d84bb\``);

        // await queryRunner.query(`DROP INDEX \`REL_44abbebbc72bd7eb40ba6df6aa\` ON \`entity_user\``);
        // await queryRunner.query(`DROP INDEX \`REL_8881a4be21d7dd833f50a64953\` ON \`entity_user\``);
        // await queryRunner.query(`DROP INDEX \`IDX_eacf61d0343fae44cb1151308c\` ON \`tail\``);

        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`idUserProcessState\` \`idUserProcessState\` int NOT NULL`);

        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP INDEX \`IDX_44abbebbc72bd7eb40ba6df6aa\``);
        // await queryRunner.query(`ALTER TABLE \`entity_user\` DROP INDEX \`IDX_8881a4be21d7dd833f50a64953\``);

        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`updateAt\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` CHANGE \`acceptMarketing\` \`acceptMarketing\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedCountryCode\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedCountryCode\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedCountry\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedCountry\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedPhoneNumber\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedPhoneNumber\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`beneficiatedNames\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`beneficiatedNames\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`phoneNumber\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`phoneNumber\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`countryCode\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`countryCode\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`country\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`country\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`lastName\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`lastName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`firstName\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`firstName\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`password\` varchar(255) NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`entity_user\` DROP COLUMN \`username\``);
        await queryRunner.query(`ALTER TABLE \`entity_user\` ADD \`username\` varchar(255) NOT NULL`);
        // await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_ca94f7bdeb65a99af46f3a19bb\` ON \`entity_user\` (\`username\`)`); // Su contraparte en 'up' está comentada

        await queryRunner.query(`ALTER TABLE \`tail\` DROP COLUMN \`updateAt\``);
        await queryRunner.query(`ALTER TABLE \`tail\` ADD \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`tail\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`tail\` ADD \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`subscription\` DROP COLUMN \`updateAt\``);
        await queryRunner.query(`ALTER TABLE \`subscription\` ADD \`updateAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`subscription\` DROP COLUMN \`createAt\``);
        await queryRunner.query(`ALTER TABLE \`subscription\` ADD \`createAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`subscription\` CHANGE \`idSubscriptionState\` \`idSubscriptionState\` int NOT NULL`);
    }
}

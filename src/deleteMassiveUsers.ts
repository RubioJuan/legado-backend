import "reflect-metadata";
import { AppDataSource } from "./config/db";
import { EntityUser } from "./entities/user.entity";

const deleteMassiveUsers = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("Database connection established");

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log("Iniciando eliminación de datos...");

      // Primero eliminar suscripciones de usuarios prueba
      const subscriptionResult = await queryRunner.query(
        `DELETE s FROM subscription s 
         INNER JOIN entity_user u ON s.idUser = u.id 
         WHERE u.username LIKE 'prueba%'`
      );
      console.log("Suscripciones eliminadas");

      // Eliminar registros de cola
      const tailResult = await queryRunner.query(
        `DELETE t FROM tail t 
         INNER JOIN entity_user u ON t.idUser = u.id 
         WHERE u.username LIKE 'prueba%'`
      );
      console.log("Registros de cola eliminados");

      // Finalmente eliminar los usuarios
      const userResult = await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(EntityUser)
        .where("username LIKE :pattern", { pattern: 'prueba%' })
        .execute();

      await queryRunner.commitTransaction();
      console.log(`Usuarios eliminados: ${userResult.affected || 0}`);
      console.log("Limpieza completada exitosamente");

    } catch (error) {
      console.error("Error durante la eliminación:", error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error("Error crítico:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Conexión a la base de datos cerrada");
    }
  }
};

// Ejecutar el script
console.log("Iniciando script de eliminación masiva...");
deleteMassiveUsers()
  .then(() => {
    console.log("Script completado exitosamente");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error en el script:", error);
    process.exit(1);
  }); 
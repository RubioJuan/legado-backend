import "reflect-metadata";
import { AppDataSource } from "./config/db";
import { encrypt } from "./utils/bcrypt.handle";

const createNormalUsers = async () => {
  let queryRunner = null;
  
  try {
    console.log("Iniciando script para crear usuarios...");
    
    await AppDataSource.initialize();
    console.log("Conexión establecida");

    queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Crear 130 usuarios normales
    const totalUsers = 90;
    console.log(`Creando ${totalUsers} usuarios...`);

    // Primero, obtener el tablero 1
    const board = await queryRunner.query(
      `SELECT * FROM board WHERE id = 1`
    );

    if (!board || board.length === 0) {
      throw new Error("No se encontró el tablero con ID 1");
    }

    let currentPosition = 1;

    for (let i = 1; i <= totalUsers; i++) {
      const username = `prueba${i}`;
      const hashedPassword = await encrypt("password123");
      
      // Crear usuario usando SQL directo
      const insertResult = await queryRunner.query(
        `INSERT INTO entity_user (
          username, 
          password, 
          firstName, 
          lastName, 
          country, 
          countryCode, 
          phoneNumber, 
          idRole, 
          idUserState, 
          idUserProcessState, 
          acceptMarketing, 
          ballsSended, 
          ballsReceived, 
          ballsReceivedConfirmed, 
          triplicationDone,
          canVerifyRecruits,
          unlockCount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          hashedPassword,
          username,
          username,
          "Colombia",
          "+57",
          "1234567890",
          2, // Todos como jugadores normales
          1, // ACTIVE state
          2, // PROCESS state
          true,
          0,
          0,
          0,
          false,
          true,
          0  // Inicializar unlockCount en 0
        ]
      );

      const userId = insertResult.insertId;
      console.log(`Usuario ${username} (ID: ${userId}) creado`);

      // Solo asignar al tablero 1 si hay espacio (15 posiciones)
      if (currentPosition <= 15) {
        // Determinar el tipo de posición
        let positionName;
        if (currentPosition <= 8) {
          positionName = `idDefender${currentPosition}`;
        } else if (currentPosition === 9) {
          positionName = 'idGoalScorer';
        } else if (currentPosition === 10) {
          positionName = 'idCreator1';
        } else if (currentPosition === 11) {
          positionName = 'idCreator2';
        } else if (currentPosition === 12) {
          positionName = 'idGenerator1';
        } else if (currentPosition === 13) {
          positionName = 'idGenerator2';
        } else if (currentPosition === 14) {
          positionName = 'idGenerator3';
        } else if (currentPosition === 15) {
          positionName = 'idGenerator4';
        }

        // Actualizar el tablero
        await queryRunner.query(
          `UPDATE board SET ${positionName} = ? WHERE id = 1`,
          [userId]
        );

        console.log(`Usuario ${username} asignado a la posición ${positionName} en el tablero 1`);

        // Crear subscription para el usuario
        await queryRunner.query(
          `INSERT INTO subscription (idBoard, idUser, idSubscriptionState) VALUES (?, ?, ?)`,
          [1, userId, 1] // Estado 1 = activo
        );

        currentPosition++;
      } else {
        // Si no hay espacio en el tablero, crear entrada en tail
        await queryRunner.query(
          `INSERT INTO tail (idUser) VALUES (?)`,
          [userId]
        );
        console.log(`Usuario ${username} agregado a la cola (tail)`);
      }

      if (i % 10 === 0) {
        console.log(`Creados ${i} usuarios de ${totalUsers}...`);
        await queryRunner.commitTransaction();
        await queryRunner.startTransaction();
      }
    }

    await queryRunner.commitTransaction();
    console.log("\nTransacción completada exitosamente");
    console.log(`Se han creado ${totalUsers} usuarios normales`);
    console.log(`Los primeros 15 usuarios han sido asignados al tablero 1`);
    console.log(`Los usuarios restantes (${totalUsers - 15}) han sido agregados a la cola (tail)`);

  } catch (error) {
    console.error("Error durante la ejecución:", error);
    if (queryRunner) {
      try {
        await queryRunner.rollbackTransaction();
      } catch (rollbackError) {
        console.error("Error durante el rollback:", rollbackError);
      }
    }
    throw error;
  } finally {
    if (queryRunner) {
      try {
        await queryRunner.release();
      } catch (releaseError) {
        console.error("Error al liberar el queryRunner:", releaseError);
      }
    }
    if (AppDataSource.isInitialized) {
      try {
        await AppDataSource.destroy();
        console.log("Conexión cerrada");
      } catch (destroyError) {
        console.error("Error al cerrar la conexión:", destroyError);
      }
    }
  }
};

// Ejecutar el script
createNormalUsers()
  .then(() => {
    console.log("Script completado exitosamente");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error en el script:", error);
    process.exit(1);
  }); 
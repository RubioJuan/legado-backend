import { In } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { BoardStateNumericId, UserProcessStateId } from "./types/enums.types";

async function resetTriplicationVerification() {
  console.log("=== RESETEANDO VERIFICACIÓN DE TRIPLICACIÓN ===");
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log("Conexión a base de datos establecida");
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener el tablero 549
      const board549 = await queryRunner.manager.findOne(Board, {
        where: { id: 549 }
      });

      if (!board549) {
        throw new Error("Tablero 549 no encontrado");
      }

      console.log(`Tablero 549 encontrado`);

      // 2. Resetear el estado de los defensores (IDs 72-79)
      const defenderIds = [72, 73, 74, 75, 76, 77, 78, 79];
      
      // Obtener los usuarios para mostrar sus nombres
      const defenders = await queryRunner.manager.find(EntityUser, {
        where: { id: In(defenderIds) }
      });

      // Resetear estado de los defensores a PROCESS
      await queryRunner.manager.update(EntityUser, 
        { id: In(defenderIds) },
        { idUserProcessState: UserProcessStateId.PROCESS }
      );

      console.log("Defensores reseteados a estado PROCESS:");
      defenders.forEach(defender => {
        console.log(`- ${defender.username} (ID: ${defender.id})`);
      });

      // 3. Actualizar el estado del tablero 549
      await queryRunner.manager.update(Board, 549, {
        currentBlockadeStage: null,
        idBoardState: BoardStateNumericId.WAITING,
        isAwaitingUserCreation: false
      });

      console.log(`Tablero 549 actualizado a estado WAITING`);

      // 4. Obtener y actualizar el tablero padre (3)
      const parentBoard = await queryRunner.manager.findOne(Board, {
        where: { id: 3 }
      });

      if (parentBoard) {
        await queryRunner.manager.update(Board, parentBoard.id, {
          currentBlockadeStage: 3,
          idBoardState: BoardStateNumericId.BLOCKED,
          isAwaitingUserCreation: false
        });
        console.log(`Tablero padre ${parentBoard.id} actualizado a estado BLOCKED con etapa 3`);
      }

      await queryRunner.commitTransaction();
      console.log("\n✅ Reset completado exitosamente!");

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

  } catch (error) {
    console.error("Error durante el reset:", error);
  } finally {
    await AppDataSource.destroy();
    console.log("\nConexión a base de datos cerrada");
  }
}

// Ejecutar el script
resetTriplicationVerification()
  .then(() => console.log("Script completado"))
  .catch(error => console.error("Error durante la ejecución:", error)); 
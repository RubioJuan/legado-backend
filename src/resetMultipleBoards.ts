import { In } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script para resetear los verificados de los jugadores en múltiples tableros
 * - Tableros 498, 499 y 3
 */
async function resetMultipleBoards() {
  const BOARD_IDS = [498, 499, 3];
  console.log(`=== RESETEANDO VERIFICADOS DE JUGADORES EN TABLEROS: ${BOARD_IDS.join(", ")} ===`);
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log("Conexión a base de datos establecida");
    
    for (const boardId of BOARD_IDS) {
      console.log(`\n=== PROCESANDO TABLERO ${boardId} ===`);
      
      // Buscar el tablero específico
      const board = await AppDataSource.manager.findOne(Board, {
        where: { id: boardId }
      });
      
      if (!board) {
        console.error(`Tablero ${boardId} no encontrado!`);
        continue; // Pasar al siguiente tablero
      }
      
      console.log(`Tablero ${boardId} encontrado con estado: ${board.idBoardState}, etapa de bloqueo: ${board.currentBlockadeStage || 'Sin bloqueo'}`);
      
      // Resetear el tablero a estado WAITING (1) y sin bloqueos
      await AppDataSource.manager.update(
        Board,
        { id: boardId },
        {
          idBoardState: 1, // WAITING
          currentBlockadeStage: null,
          isAwaitingUserCreation: false
        }
      );
      
      console.log(`Tablero ${boardId} reseteado a estado WAITING sin bloqueos`);
      
      // Recolectar todos los IDs de usuarios del tablero (excluyendo nulls)
      const userIds = [
        board.idGoalScorer,
        board.idCreator1, board.idCreator2,
        board.idGenerator1, board.idGenerator2, board.idGenerator3, board.idGenerator4,
        board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
        board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
      ].filter(id => id !== null) as number[];
      
      if (userIds.length === 0) {
        console.log(`No se encontraron usuarios en el tablero ${boardId}`);
        continue;
      }
      
      console.log(`Se encontraron ${userIds.length} usuarios en el tablero ${boardId}`);
      
      // Resetear todos los usuarios a estado PROCESS (2 - no verificado)
      const updateResult = await AppDataSource.manager.update(
        EntityUser,
        { id: In(userIds) },
        {
          idUserProcessState: 2, // PROCESS (no verificado)
          ballsReceived: 0,
          ballsReceivedConfirmed: 0
        }
      );
      
      console.log(`Se resetearon ${updateResult.affected} usuarios en el tablero ${boardId}`);
      
      // Resetear triplicación del general si existe
      if (board.idGoalScorer) {
        // Reset general's triplication status
        await AppDataSource.manager.update(
          EntityUser,
          { id: board.idGoalScorer },
          { triplicationDone: false }
        );
        
        // Encontrar y eliminar usuarios hijos de triplicación
        const childrenCount = await AppDataSource.manager.count(EntityUser, {
          where: { triplicationOfId: board.idGoalScorer }
        });
        
        if (childrenCount > 0) {
          console.log(`Encontrados ${childrenCount} usuarios hijos del general ${board.idGoalScorer}`);
          
          // Eliminar usuarios hijos (para pruebas limpias)
          await AppDataSource.manager.delete(
            EntityUser,
            { triplicationOfId: board.idGoalScorer }
          );
          
          console.log(`Eliminados ${childrenCount} usuarios hijos para pruebas limpias`);
        }
      }
    }
    
    console.log("\n=== RESETEO COMPLETADO CON ÉXITO ===");
    
  } catch (error) {
    console.error("Error durante el reseteo:", error);
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
    console.log("\nConexión a base de datos cerrada");
  }
}

// Ejecutar la función
resetMultipleBoards()
  .then(() => console.log("Proceso de reseteo completado"))
  .catch(error => console.error("Error durante el proceso de reseteo:", error)); 
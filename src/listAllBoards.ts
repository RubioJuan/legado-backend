import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";

/**
 * Script para listar todos los tableros disponibles en la base de datos
 */
async function listAllBoards() {
  console.log("=== LISTANDO TODOS LOS TABLEROS ===");
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log("Conexión a base de datos establecida");
    
    // Buscar todos los tableros
    const boards = await AppDataSource.manager.find(Board, {
      order: { id: "ASC" }
    });
    
    console.log(`\nSe encontraron ${boards.length} tableros en total\n`);
    
    // Mostrar información resumida de cada tablero
    if (boards.length > 0) {
      console.log("ID\tNivel\tEstado\tEtapa de Bloqueo\tGeneral ID");
      console.log("------------------------------------------------------------------");
      
      boards.forEach(board => {
        console.log(`${board.id}\t${board.idLevelId}\t${board.idBoardState}\t${board.currentBlockadeStage || 'Sin bloqueo'}\t\t${board.idGoalScorer || 'Sin general'}`);
      });
      
      // Mostrar los tableros activos con generales
      const activeBoards = boards.filter(b => b.idBoardState === 1 && b.idGoalScorer !== null);
      console.log(`\n=== TABLEROS ACTIVOS CON GENERAL (${activeBoards.length}) ===`);
      
      if (activeBoards.length > 0) {
        console.log("ID\tNivel\tGeneral ID");
        console.log("---------------------------");
        
        activeBoards.forEach(board => {
          console.log(`${board.id}\t${board.idLevelId}\t${board.idGoalScorer}`);
        });
      }
      
      // Mostrar los tableros bloqueados
      const blockedBoards = boards.filter(b => b.currentBlockadeStage !== null);
      console.log(`\n=== TABLEROS BLOQUEADOS (${blockedBoards.length}) ===`);
      
      if (blockedBoards.length > 0) {
        console.log("ID\tNivel\tEtapa de Bloqueo\tGeneral ID");
        console.log("------------------------------------------");
        
        blockedBoards.forEach(board => {
          console.log(`${board.id}\t${board.idLevelId}\t${board.currentBlockadeStage}\t\t${board.idGoalScorer}`);
        });
      }
    }
    
  } catch (error) {
    console.error("Error al listar los tableros:", error);
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
    console.log("\nConexión a base de datos cerrada");
  }
}

// Ejecutar la función
listAllBoards()
  .then(() => console.log("Listado completado"))
  .catch(error => console.error("Error durante el listado:", error)); 
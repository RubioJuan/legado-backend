import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";

async function revertApoloBoard() {
  try {
    await AppDataSource.initialize();
    
    console.log("=== REVIRTIENDO TABLERO DE APOLO AL ESTADO CORRECTO ===");
    
    // Buscar el tablero de Apolo
    const apoloBoard = await AppDataSource.manager.findOne(Board, {
      where: { idLevelId: 3 },
      order: { id: "ASC" }
    });
    
    if (!apoloBoard) {
      console.log("❌ No se encontró tablero de Apolo");
      return;
    }
    
    console.log(`Tablero encontrado: ID ${apoloBoard.id}`);
    console.log(`Estado actual: ${apoloBoard.idBoardState}`);
    
    if (apoloBoard.idBoardState !== 1) {
      console.log("🔧 REVIRTIENDO: Cambiando estado del tablero a ACTIVO (1)");
      
      await AppDataSource.manager.update(Board, apoloBoard.id, {
        idBoardState: 1 // ACTIVO (esperando jugadores)
      });
      
      console.log(`✅ Tablero ${apoloBoard.id} revertido a estado ACTIVO (1)`);
    } else {
      console.log(`✅ El tablero ya está en estado ACTIVO (1)`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

revertApoloBoard().catch(console.error); 
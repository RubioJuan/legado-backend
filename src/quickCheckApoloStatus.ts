import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

async function quickCheckApoloStatus() {
  try {
    await AppDataSource.initialize();
    
    console.log("=== CHECK RÁPIDO APOLO ===");
    
    // Buscar tablero de Apolo (ID 4)
    const apoloBoard = await AppDataSource.manager.findOne(Board, {
      where: { id: 4 }
    });
    
    if (!apoloBoard) {
      console.log("❌ No se encontró tablero de Apolo (ID 4)");
      return;
    }
    
    console.log(`Tablero Apolo ID: ${apoloBoard.id}`);
    console.log(`Estado: ${apoloBoard.idBoardState} (${apoloBoard.idBoardState === 1 ? 'ACTIVO' : apoloBoard.idBoardState === 2 ? 'INACTIVO' : 'BLOQUEADO'})`);
    console.log(`Nivel: ${apoloBoard.idLevelId}`);
    
    // Verificar posiciones de recluta
    const recruits = [
      { pos: 'idDefender1', id: apoloBoard.idDefender1 },
      { pos: 'idDefender2', id: apoloBoard.idDefender2 },
      { pos: 'idDefender3', id: apoloBoard.idDefender3 },
      { pos: 'idDefender4', id: apoloBoard.idDefender4 },
      { pos: 'idDefender5', id: apoloBoard.idDefender5 },
      { pos: 'idDefender6', id: apoloBoard.idDefender6 },
      { pos: 'idDefender7', id: apoloBoard.idDefender7 },
      { pos: 'idDefender8', id: apoloBoard.idDefender8 },
    ];
    
    console.log("\n--- POSICIONES DE RECLUTA ---");
    let occupiedCount = 0;
    let dualRoleCount = 0;
    
    for (const recruit of recruits) {
      if (recruit.id) {
        occupiedCount++;
        
        // Verificar si es rol dual
        const user = await AppDataSource.manager.findOne(EntityUser, {
          where: { id: recruit.id }
        });
        
        if (user && user.secondaryBoardIdAsRecruit === apoloBoard.id) {
          dualRoleCount++;
          console.log(`${recruit.pos}: Usuario ${user.username} (ROL DUAL)`);
        } else if (user) {
          console.log(`${recruit.pos}: Usuario ${user.username} (normal)`);
        } else {
          console.log(`${recruit.pos}: ID ${recruit.id} (usuario no encontrado)`);
        }
      } else {
        console.log(`${recruit.pos}: VACÍO`);
      }
    }
    
    console.log(`\n--- RESUMEN ---`);
    console.log(`Posiciones ocupadas: ${occupiedCount}/8`);
    console.log(`Jugadores con rol dual: ${dualRoleCount}`);
    console.log(`Slots disponibles: ${8 - occupiedCount}`);
    
    if (dualRoleCount > 0) {
      console.log(`✅ ¡HAY JUGADORES CON ROL DUAL EN APOLO!`);
    } else {
      console.log(`❌ No hay jugadores con rol dual en Apolo`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

quickCheckApoloStatus().catch(console.error); 
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";

async function fixApoloBoard() {
  try {
    await AppDataSource.initialize();
    
    console.log("=== VERIFICANDO Y CORRIGIENDO TABLERO DE APOLO ===");
    
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
    console.log(`- 1 = ESPERANDO jugadores`);
    console.log(`- 2 = ACTIVO`);
    console.log(`- 3 = BLOQUEADO`);
    
    // Verificar ocupación del tablero
    const positions = [
      { name: 'idGoalScorer', value: apoloBoard.idGoalScorer },
      { name: 'idCreator1', value: apoloBoard.idCreator1 },
      { name: 'idCreator2', value: apoloBoard.idCreator2 },
      { name: 'idGenerator1', value: apoloBoard.idGenerator1 },
      { name: 'idGenerator2', value: apoloBoard.idGenerator2 },
      { name: 'idGenerator3', value: apoloBoard.idGenerator3 },
      { name: 'idGenerator4', value: apoloBoard.idGenerator4 },
      { name: 'idDefender1', value: apoloBoard.idDefender1 },
      { name: 'idDefender2', value: apoloBoard.idDefender2 },
      { name: 'idDefender3', value: apoloBoard.idDefender3 },
      { name: 'idDefender4', value: apoloBoard.idDefender4 },
      { name: 'idDefender5', value: apoloBoard.idDefender5 },
      { name: 'idDefender6', value: apoloBoard.idDefender6 },
      { name: 'idDefender7', value: apoloBoard.idDefender7 },
      { name: 'idDefender8', value: apoloBoard.idDefender8 }
    ];
    
    const occupiedPositions = positions.filter(p => p.value !== null);
    const emptyPositions = positions.filter(p => p.value === null);
    
    console.log(`\nOcupación del tablero:`);
    console.log(`- Posiciones ocupadas: ${occupiedPositions.length}/15`);
    console.log(`- Posiciones vacías: ${emptyPositions.length}/15`);
    
    if (occupiedPositions.length > 0) {
      console.log(`\nPosiciones ocupadas:`);
      occupiedPositions.forEach(p => {
        console.log(`  - ${p.name}: Usuario ${p.value}`);
      });
    }
    
    if (emptyPositions.length > 0) {
      console.log(`\nPosiciones vacías:`);
      emptyPositions.forEach(p => {
        console.log(`  - ${p.name}`);
      });
    }
    
    // Verificar si debe estar ACTIVO
    // Un tablero debe estar ACTIVO si tiene al menos el General (idGoalScorer)
    const shouldBeActive = apoloBoard.idGoalScorer !== null;
    
    console.log(`\n¿Debe estar ACTIVO? ${shouldBeActive ? 'SÍ' : 'NO'}`);
    
    if (shouldBeActive && apoloBoard.idBoardState !== 2) {
      console.log(`\n🔧 CORRIGIENDO: Cambiando estado del tablero a ACTIVO (2)`);
      
      await AppDataSource.manager.update(Board, apoloBoard.id, {
        idBoardState: 2 // ACTIVO
      });
      
      console.log(`✅ Tablero ${apoloBoard.id} cambiado a estado ACTIVO`);
      console.log(`\nAhora el rol dual Armagedón→Apolo debería funcionar!`);
      
    } else if (!shouldBeActive) {
      console.log(`\n📝 NOTA: El tablero no tiene General, por eso está en ESPERANDO`);
      console.log(`Para activarlo, necesita tener al menos un General asignado.`);
      
    } else {
      console.log(`\n✅ El tablero ya está en el estado correcto`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

fixApoloBoard().catch(console.error); 
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";

async function checkApoloBoards() {
  try {
    await AppDataSource.initialize();
    
    console.log("=== VERIFICANDO TABLEROS DE APOLO ===");
    
    // Verificar tableros en Apolo (nivel 3)
    const apoloBoards = await AppDataSource.manager.find(Board, {
      where: { idLevelId: 3 },
      order: { id: "ASC" }
    });
    
    console.log(`Total tableros en Apolo: ${apoloBoards.length}`);
    
    if (apoloBoards.length === 0) {
      console.log("❌ NO HAY TABLEROS EN APOLO - Este es el problema!");
      console.log("Para que funcione el rol dual Armagedón→Apolo, necesita haber tableros activos en Apolo (nivel 3)");
    } else {
      console.log("✅ Sí hay tableros en Apolo");
      
      // Contar por estado
      const activeBoards = apoloBoards.filter(b => b.idBoardState === 1);
      const waitingBoards = apoloBoards.filter(b => b.idBoardState === 2);
      const blockedBoards = apoloBoards.filter(b => b.idBoardState === 3);
      
      console.log(`- ACTIVOS: ${activeBoards.length}`);
      console.log(`- ESPERANDO: ${waitingBoards.length}`);
      console.log(`- BLOQUEADOS: ${blockedBoards.length}`);
      
      if (activeBoards.length === 0) {
        console.log("❌ NO HAY TABLEROS ACTIVOS EN APOLO - Este puede ser el problema!");
        console.log("setupPotentialDualRoleForGeneralService busca tableros con estado ACTIVE (idBoardState = 1)");
      }
      
      // Verificar slots disponibles en tableros activos
      let totalAvailableSlots = 0;
      for (const board of activeBoards) {
        const defenderSlots = [
          board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
          board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
        ];
        
        const availableSlots = defenderSlots.filter(slot => slot === null).length;
        totalAvailableSlots += availableSlots;
        
        console.log(`Tablero ${board.id}: ${availableSlots} slots de recluta disponibles`);
      }
      
      console.log(`Total slots de recluta disponibles en Apolo: ${totalAvailableSlots}`);
      
      if (totalAvailableSlots === 0) {
        console.log("❌ NO HAY SLOTS DE RECLUTA DISPONIBLES EN APOLO - Este puede ser el problema!");
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkApoloBoards().catch(console.error); 
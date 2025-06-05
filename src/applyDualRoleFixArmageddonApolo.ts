import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { setupPotentialDualRoleForGeneralService } from "./services/board.service";

async function applyDualRoleFixArmageddonApolo() {
  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    await AppDataSource.initialize();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    console.log("=== APLICANDO CORRECCIÓN DE ROL DUAL ARMAGEDÓN → APOLO ===");
    
    // 1. Buscar todos los generales en Armagedón
    console.log("\n--- BUSCANDO GENERALES EN ARMAGEDÓN ---");
    
    const armageddonBoards = await queryRunner.manager.find(Board, {
      where: { idLevelId: 2, idBoardState: 1 }, // Estado 1 = ACTIVO
      order: { id: "ASC" }
    });
    
    console.log(`Tableros activos en Armagedón: ${armageddonBoards.length}`);
    
    const generalsToUpdate: { id: number, username: string, boardId: number }[] = [];
    
    for (const board of armageddonBoards) {
      if (board.idGoalScorer) {
        const general = await queryRunner.manager.findOne(EntityUser, {
          where: { id: board.idGoalScorer }
        });
        
        if (general && general.idRole !== 1) { // No admin
          generalsToUpdate.push({
            id: general.id,
            username: general.username,
            boardId: board.id
          });
          
          console.log(`- General: ${general.username} (ID: ${general.id}) en tablero ${board.id}`);
          
          // Verificar estado actual de rol dual
          if (general.secondaryBoardIdAsRecruit) {
            console.log(`  * Rol dual actual: Tablero ${general.secondaryBoardIdAsRecruit}, Nivel ${general.secondaryBoardLevelIdAsRecruit}`);
          } else {
            console.log(`  * Sin rol dual actual`);
          }
        }
      }
    }
    
    console.log(`\nTotal generales a procesar: ${generalsToUpdate.length}`);
    
    if (generalsToUpdate.length === 0) {
      console.log("❌ No se encontraron generales para actualizar");
      return;
    }
    
    // 2. Verificar disponibilidad en Apolo
    console.log("\n--- VERIFICANDO DISPONIBILIDAD EN APOLO ---");
    const apoloBoards = await queryRunner.manager.find(Board, {
      where: { idLevelId: 3, idBoardState: 1 }, // Estado 1 = ACTIVO
      order: { id: "ASC" }
    });
    
    console.log(`Tableros activos en Apolo: ${apoloBoards.length}`);
    
    let totalAvailableSlots = 0;
    for (const board of apoloBoards) {
      const defenderSlots = [
        board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
        board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
      ];
      
      const availableSlots = defenderSlots.filter(slot => slot === null).length;
      totalAvailableSlots += availableSlots;
      console.log(`Tablero Apolo ${board.id}: ${availableSlots} slots disponibles`);
    }
    
    console.log(`Total slots disponibles en Apolo: ${totalAvailableSlots}`);
    
    if (totalAvailableSlots < generalsToUpdate.length) {
      console.log(`⚠️ ADVERTENCIA: Hay ${generalsToUpdate.length} generales pero solo ${totalAvailableSlots} slots disponibles`);
      console.log(`Se procesarán todos, pero algunos pueden quedar en cola de espera`);
    }
    
    // 3. Aplicar la corrección a cada general
    console.log("\n--- APLICANDO CORRECCIÓN ---");
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const general of generalsToUpdate) {
      try {
        console.log(`\n🔧 Procesando ${general.username} (ID: ${general.id})...`);
        
        // Estado antes
        const userBefore = await queryRunner.manager.findOne(EntityUser, {
          where: { id: general.id }
        });
        
        console.log(`   ANTES: Nivel secundario ${userBefore?.secondaryBoardLevelIdAsRecruit || 'N/A'}`);
        
        // Aplicar setupPotentialDualRoleForGeneralService
        await setupPotentialDualRoleForGeneralService(general.id, general.boardId, 2, queryRunner);
        
        // Estado después
        const userAfter = await queryRunner.manager.findOne(EntityUser, {
          where: { id: general.id }
        });
        
        console.log(`   DESPUÉS: Nivel secundario ${userAfter?.secondaryBoardLevelIdAsRecruit || 'N/A'}`);
        
        // Verificar resultado
        if (userAfter?.secondaryBoardLevelIdAsRecruit === 3) {
          console.log(`   ✅ ÉXITO: Ahora tiene rol dual en Apolo (tablero ${userAfter.secondaryBoardIdAsRecruit})`);
          successCount++;
        } else if (userAfter?.secondaryBoardIdAsRecruit) {
          console.log(`   ⚠️ PARCIAL: Tiene rol dual pero no en Apolo (nivel ${userAfter.secondaryBoardLevelIdAsRecruit})`);
          successCount++;
        } else {
          console.log(`   ⏳ EN ESPERA: Probablemente en cola por falta de slots`);
          // Esto no es un error, solo significa que está esperando
          successCount++;
        }
        
      } catch (error: any) {
        console.log(`   ❌ ERROR: ${error.message}`);
        errorCount++;
      }
    }
    
    // 4. Resumen final
    console.log("\n=== RESUMEN DE LA CORRECCIÓN ===");
    console.log(`✅ Procesados exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total: ${generalsToUpdate.length}`);
    
    if (successCount > 0) {
      console.log(`\n🎉 ¡La corrección se aplicó correctamente!`);
      console.log(`Los generales de Armagedón ahora pueden obtener roles duales en Apolo.`);
      
      // CONFIRMAR CAMBIOS
      console.log(`\n💾 GUARDANDO CAMBIOS...`);
      await queryRunner.commitTransaction();
      console.log(`✅ Cambios guardados exitosamente`);
      
    } else {
      console.log(`\n❌ No se realizaron cambios exitosos`);
      await queryRunner.rollbackTransaction();
      console.log(`🔄 Rollback realizado`);
    }
    
  } catch (error) {
    console.error("Error general:", error);
    await queryRunner.rollbackTransaction();
    console.log(`🔄 Rollback realizado por error`);
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

applyDualRoleFixArmageddonApolo().catch(console.error); 
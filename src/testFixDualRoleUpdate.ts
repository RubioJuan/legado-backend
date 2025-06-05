import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { setupPotentialDualRoleForGeneralService } from "./services/board.service";

async function testFixDualRoleUpdate() {
  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    await AppDataSource.initialize();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    console.log("=== PROBANDO ACTUALIZACIÓN DE ROL DUAL ARMAGEDÓN → APOLO ===");
    
    // 1. Buscar un general en Armagedón que tenga rol dual en Armagedón
    console.log("\n--- BUSCANDO GENERAL CON ROL DUAL EN ARMAGEDÓN ---");
    
    const armageddonBoards = await queryRunner.manager.find(Board, {
      where: { idLevelId: 2, idBoardState: 1 }, // Estado 1 = ACTIVO
      order: { id: "ASC" }
    });
    
    let testGeneralId: number | null = null;
    let testBoardId: number | null = null;
    
    for (const board of armageddonBoards) {
      if (board.idGoalScorer) {
        const general = await queryRunner.manager.findOne(EntityUser, {
          where: { id: board.idGoalScorer }
        });
        
        if (general && 
            general.idRole !== 1 && // No admin
            general.secondaryBoardIdAsRecruit && // Tiene rol dual
            general.secondaryBoardLevelIdAsRecruit === 2) { // Rol dual en Armagedón
          
          testGeneralId = general.id;
          testBoardId = board.id;
          
          console.log(`✅ Encontrado general con rol dual en Armagedón:`);
          console.log(`   - Usuario: ${general.username} (ID: ${general.id})`);
          console.log(`   - Tablero primario: ${board.id} (Armagedón)`);
          console.log(`   - Tablero secundario actual: ${general.secondaryBoardIdAsRecruit} (Nivel ${general.secondaryBoardLevelIdAsRecruit})`);
          console.log(`   - Posición secundaria actual: ${general.secondaryPositionAsRecruit}`);
          break;
        }
      }
    }
    
    if (!testGeneralId || !testBoardId) {
      console.log("❌ No se encontró general con rol dual en Armagedón para probar");
      console.log("Esto puede significar que:");
      console.log("1. No hay generales con roles duales existentes");
      console.log("2. Los roles duales ya están en el nivel correcto");
      console.log("3. Todos los generales son admins");
      return;
    }
    
    // 2. Verificar tableros disponibles en Apolo
    console.log("\n--- VERIFICANDO TABLEROS DISPONIBLES EN APOLO ---");
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
      console.log(`Tablero Apolo ${board.id}: ${availableSlots} slots de recluta disponibles`);
    }
    
    console.log(`Total slots disponibles en Apolo: ${totalAvailableSlots}`);
    
    if (totalAvailableSlots === 0) {
      console.log("❌ No hay slots disponibles en Apolo");
      return;
    }
    
    // 3. ESTADO ANTES
    const userBefore = await queryRunner.manager.findOne(EntityUser, {
      where: { id: testGeneralId }
    });
    
    console.log(`\n--- ESTADO ANTES DE LA ACTUALIZACIÓN ---`);
    console.log(`- secondaryBoardIdAsRecruit: ${userBefore?.secondaryBoardIdAsRecruit}`);
    console.log(`- secondaryBoardLevelIdAsRecruit: ${userBefore?.secondaryBoardLevelIdAsRecruit} (debería ser 2 = Armagedón)`);
    console.log(`- secondaryPositionAsRecruit: ${userBefore?.secondaryPositionAsRecruit}`);
    console.log(`- canVerifyRecruits: ${userBefore?.canVerifyRecruits}`);
    
    // 4. EJECUTAR setupPotentialDualRoleForGeneralService
    console.log(`\n--- EJECUTANDO setupPotentialDualRoleForGeneralService ---`);
    console.log(`Parámetros:`);
    console.log(`- generalUserId: ${testGeneralId}`);
    console.log(`- primaryBoardId: ${testBoardId} (Armagedón)`);
    console.log(`- primaryLevelId: 2 (Armagedón)`);
    console.log(`- Target Level: 3 (Apolo)`);
    
    await setupPotentialDualRoleForGeneralService(testGeneralId, testBoardId, 2, queryRunner);
    
    // 5. ESTADO DESPUÉS
    const userAfter = await queryRunner.manager.findOne(EntityUser, {
      where: { id: testGeneralId }
    });
    
    console.log(`\n--- ESTADO DESPUÉS DE LA ACTUALIZACIÓN ---`);
    console.log(`- secondaryBoardIdAsRecruit: ${userAfter?.secondaryBoardIdAsRecruit}`);
    console.log(`- secondaryBoardLevelIdAsRecruit: ${userAfter?.secondaryBoardLevelIdAsRecruit} (debería ser 3 = Apolo)`);
    console.log(`- secondaryPositionAsRecruit: ${userAfter?.secondaryPositionAsRecruit}`);
    console.log(`- canVerifyRecruits: ${userAfter?.canVerifyRecruits}`);
    
    // 6. VERIFICAR RESULTADOS
    console.log(`\n--- ANÁLISIS DE RESULTADOS ---`);
    
    const wasUpdated = userAfter?.secondaryBoardLevelIdAsRecruit === 3;
    
    if (wasUpdated) {
      console.log(`🎉 ¡ÉXITO! El rol dual se actualizó a Apolo (nivel 3)`);
      
      // Verificar consistencia en el tablero
      if (userAfter?.secondaryBoardIdAsRecruit && userAfter?.secondaryPositionAsRecruit) {
        const targetBoard = await queryRunner.manager.findOne(Board, {
          where: { id: userAfter.secondaryBoardIdAsRecruit }
        });
        
        if (targetBoard) {
          const positionValue = targetBoard[userAfter.secondaryPositionAsRecruit as keyof Board];
          console.log(`- Tablero objetivo: ${userAfter.secondaryBoardIdAsRecruit}`);
          console.log(`- Posición asignada: ${userAfter.secondaryPositionAsRecruit}`);
          console.log(`- Valor en tablero: ${positionValue}`);
          console.log(`- Consistencia: ${positionValue === testGeneralId ? '✅ CORRECTO' : '❌ INCONSISTENTE'}`);
        }
      }
      
      // Verificar que se limpió la posición anterior
      if (userBefore?.secondaryBoardIdAsRecruit && userBefore?.secondaryPositionAsRecruit) {
        const oldBoard = await queryRunner.manager.findOne(Board, {
          where: { id: userBefore.secondaryBoardIdAsRecruit }
        });
        
        if (oldBoard) {
          const oldPositionValue = oldBoard[userBefore.secondaryPositionAsRecruit as keyof Board];
          console.log(`- Posición anterior limpiada: ${oldPositionValue === null ? '✅ SÍ' : '❌ NO'}`);
        }
      }
      
    } else {
      console.log(`❌ FALLO: El rol dual NO se actualizó`);
      console.log(`Nivel esperado: 3 (Apolo), Nivel actual: ${userAfter?.secondaryBoardLevelIdAsRecruit}`);
    }
    
    // IMPORTANTE: Hacer rollback
    console.log(`\n🔄 HACIENDO ROLLBACK...`);
    await queryRunner.rollbackTransaction();
    console.log(`✅ Rollback completado - cambios no guardados`);
    
  } catch (error) {
    console.error("Error:", error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

testFixDualRoleUpdate().catch(console.error); 
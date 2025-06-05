import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { setupPotentialDualRoleForGeneralService } from "./services/board.service";

async function testDualRoleArmageddonApolo() {
  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    await AppDataSource.initialize();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    console.log("=== PROBANDO ROL DUAL ARMAGEDÓN → APOLO ===");
    
    // 1. Buscar generales en Armagedón (nivel 2)
    console.log("\n--- BUSCANDO GENERALES EN ARMAGEDÓN ---");
    const armageddonBoards = await queryRunner.manager.find(Board, {
      where: { idLevelId: 2, idBoardState: 1 }, // Estado 1 = ACTIVO
      order: { id: "ASC" }
    });
    
    console.log(`Tableros activos en Armagedón: ${armageddonBoards.length}`);
    
    let testGeneralId: number | null = null;
    let testBoardId: number | null = null;
    
    for (const board of armageddonBoards) {
      if (board.idGoalScorer) {
        const general = await queryRunner.manager.findOne(EntityUser, {
          where: { id: board.idGoalScorer }
        });
        
        if (general && general.idRole !== 1) { // No admin
          testGeneralId = general.id;
          testBoardId = board.id;
          console.log(`✅ Encontrado general NO-ADMIN para prueba:`);
          console.log(`   - Usuario: ${general.username} (ID: ${general.id})`);
          console.log(`   - Tablero: ${board.id}`);
          console.log(`   - Rol dual actual: ${general.secondaryBoardIdAsRecruit ? 'SÍ' : 'NO'}`);
          break;
        }
      }
    }
    
    if (!testGeneralId || !testBoardId) {
      console.log("❌ No se encontró general no-admin en Armagedón para probar");
      return;
    }
    
    // 2. Verificar tableros disponibles en Apolo
    console.log("\n--- VERIFICANDO TABLEROS EN APOLO ---");
    const apoloBoards = await queryRunner.manager.find(Board, {
      where: { idLevelId: 3, idBoardState: 1 }, // Estado 1 = ACTIVO
      order: { id: "ASC" }
    });
    
    console.log(`Tableros activos en Apolo: ${apoloBoards.length}`);
    
    if (apoloBoards.length === 0) {
      console.log("❌ No hay tableros activos en Apolo");
      return;
    }
    
    for (const board of apoloBoards) {
      const defenderSlots = [
        board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
        board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
      ];
      
      const availableSlots = defenderSlots.filter(slot => slot === null).length;
      console.log(`Tablero Apolo ${board.id}: ${availableSlots} slots de recluta disponibles`);
    }
    
    // 3. Probar setupPotentialDualRoleForGeneralService
    console.log("\n--- PROBANDO setupPotentialDualRoleForGeneralService ---");
    console.log(`Parámetros:`);
    console.log(`- generalUserId: ${testGeneralId}`);
    console.log(`- primaryBoardId: ${testBoardId}`);
    console.log(`- primaryLevelId: 2 (Armagedón)`);
    
    // Estado ANTES
    const userBefore = await queryRunner.manager.findOne(EntityUser, {
      where: { id: testGeneralId }
    });
    
    console.log(`\nESTADO ANTES:`);
    console.log(`- secondaryBoardIdAsRecruit: ${userBefore?.secondaryBoardIdAsRecruit}`);
    console.log(`- secondaryBoardLevelIdAsRecruit: ${userBefore?.secondaryBoardLevelIdAsRecruit}`);
    console.log(`- secondaryPositionAsRecruit: ${userBefore?.secondaryPositionAsRecruit}`);
    console.log(`- canVerifyRecruits: ${userBefore?.canVerifyRecruits}`);
    
    // Ejecutar el servicio
    console.log(`\n🧪 EJECUTANDO setupPotentialDualRoleForGeneralService...`);
    await setupPotentialDualRoleForGeneralService(testGeneralId, testBoardId, 2, queryRunner);
    
    // Estado DESPUÉS
    const userAfter = await queryRunner.manager.findOne(EntityUser, {
      where: { id: testGeneralId }
    });
    
    console.log(`\nESTADO DESPUÉS:`);
    console.log(`- secondaryBoardIdAsRecruit: ${userAfter?.secondaryBoardIdAsRecruit}`);
    console.log(`- secondaryBoardLevelIdAsRecruit: ${userAfter?.secondaryBoardLevelIdAsRecruit}`);
    console.log(`- secondaryPositionAsRecruit: ${userAfter?.secondaryPositionAsRecruit}`);
    console.log(`- canVerifyRecruits: ${userAfter?.canVerifyRecruits}`);
    
    // Verificar si se asignó en el tablero
    if (userAfter?.secondaryBoardIdAsRecruit && userAfter?.secondaryPositionAsRecruit) {
      const targetBoard = await queryRunner.manager.findOne(Board, {
        where: { id: userAfter.secondaryBoardIdAsRecruit }
      });
      
      if (targetBoard) {
        const positionValue = targetBoard[userAfter.secondaryPositionAsRecruit as keyof Board];
        console.log(`\n✅ VERIFICACIÓN DE POSICIÓN EN TABLERO:`);
        console.log(`- Tablero: ${userAfter.secondaryBoardIdAsRecruit}`);
        console.log(`- Posición: ${userAfter.secondaryPositionAsRecruit}`);
        console.log(`- Valor en tablero: ${positionValue}`);
        console.log(`- Consistencia: ${positionValue === testGeneralId ? '✅ CORRECTO' : '❌ INCONSISTENTE'}`);
        
        if (positionValue === testGeneralId) {
          console.log(`\n🎉 ¡ROL DUAL CREADO EXITOSAMENTE!`);
        }
      }
    } else {
      console.log(`\n❌ NO SE CREÓ ROL DUAL`);
      console.log(`Revisar logs para entender por qué no se asignó.`);
    }
    
    // IMPORTANTE: Hacer rollback para no afectar datos reales
    console.log(`\n🔄 HACIENDO ROLLBACK...`);
    await queryRunner.rollbackTransaction();
    console.log(`✅ Rollback completado - no se guardaron cambios`);
    
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

testDualRoleArmageddonApolo().catch(console.error); 
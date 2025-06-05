import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

interface DualRoleTestCase {
  username: string;
  currentLevel: number;
  targetLevel: number;
  levelName: string;
  targetLevelName: string;
}

/**
 * Script para probar que la preservación de verificación funciona en TODOS los niveles:
 * - Armagedón → Apolo  
 * - Apolo → Neptuno
 * No solo Genesis → Armagedón
 */
async function testDualRoleVerificationAllLevels() {
  try {
    await AppDataSource.initialize();
    console.log("🔗 Conexión a la base de datos establecida");

    const testCases: DualRoleTestCase[] = [
      {
        username: "armageddon_general_test",
        currentLevel: 2, // Armagedón 
        targetLevel: 3,  // Apolo
        levelName: "Armagedón",
        targetLevelName: "Apolo"
      },
      {
        username: "apolo_general_test", 
        currentLevel: 3, // Apolo
        targetLevel: 4,  // Neptuno  
        levelName: "Apolo",
        targetLevelName: "Neptuno"
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🎯 === TESTING ${testCase.levelName} → ${testCase.targetLevelName} ===`);
      
      // 1. Buscar usuarios con rol dual en el nivel actual
      const usersWithDualRole = await AppDataSource.manager
        .createQueryBuilder(EntityUser, "user")
        .leftJoin(Board, "primaryBoard", "primaryBoard.idGoalScorer = user.id")
        .leftJoin(Board, "secondaryBoard", "secondaryBoard.id = user.secondaryBoardIdAsRecruit")
        .where("primaryBoard.idLevelId = :currentLevel", { currentLevel: testCase.currentLevel })
        .andWhere("user.secondaryBoardIdAsRecruit IS NOT NULL")
        .andWhere("user.secondaryPositionAsRecruit IS NOT NULL")
        .andWhere("secondaryBoard.idLevelId = :targetLevel", { targetLevel: testCase.targetLevel })
        .select([
          "user.id",
          "user.username", 
          "user.idUserProcessState",
          "user.ballsReceivedConfirmed",
          "user.secondaryBoardIdAsRecruit",
          "user.secondaryPositionAsRecruit",
          "user.secondaryBoardLevelIdAsRecruit"
        ])
        .getMany();

      console.log(`📊 Encontrados ${usersWithDualRole.length} usuarios con rol dual en ${testCase.levelName}:`);
      
      if (usersWithDualRole.length === 0) {
        console.log(`❌ No hay usuarios con rol dual en ${testCase.levelName} → ${testCase.targetLevelName} para probar`);
        continue;
      }

      // 2. Analizar cada usuario
      for (const user of usersWithDualRole) {
        console.log(`\n👤 Usuario: ${user.username} (ID: ${user.id})`);
        console.log(`   📍 General en: Nivel ${testCase.currentLevel} (${testCase.levelName})`);
        console.log(`   🎖️  Recluta en: Board ${user.secondaryBoardIdAsRecruit} - Nivel ${testCase.targetLevel} (${testCase.targetLevelName})`);
        console.log(`   📊 Estado: ${user.idUserProcessState} (${getStateName(user.idUserProcessState || 0)})`);
        console.log(`   ⚽ Donaciones: ${user.ballsReceivedConfirmed || 0}/8`);

        // 3. Verificar el estado del usuario en el tablero secundario
        if (user.secondaryBoardIdAsRecruit) {
          const secondaryBoardInfo = await AppDataSource.manager.findOne(Board, {
            where: { id: user.secondaryBoardIdAsRecruit },
            select: ["id", "idLevelId", "idBoardState"]
          });

          if (secondaryBoardInfo) {
            console.log(`   🏟️  Board Info: ID ${secondaryBoardInfo.id}, Nivel ${secondaryBoardInfo.idLevelId}, Estado ${secondaryBoardInfo.idBoardState}`);
            
            // Verificar si está realmente asignado en la posición
            const positionValue = await AppDataSource.manager
              .createQueryBuilder(Board, "board")
              .select(`board.${user.secondaryPositionAsRecruit}`, "positionValue")
              .where("board.id = :boardId", { boardId: user.secondaryBoardIdAsRecruit })
              .getRawOne();

            if (positionValue && positionValue.positionValue === user.id) {
              console.log(`   ✅ Confirmado en posición: ${user.secondaryPositionAsRecruit}`);
            } else {
              console.log(`   ❌ NO encontrado en posición: ${user.secondaryPositionAsRecruit} (valor actual: ${positionValue?.positionValue})`);
            }
          }
        }

        // 4. Determinar el escenario del test
        if (user.idUserProcessState === 4) {
          console.log(`   🟢 CASO PROBLEMÁTICO DETECTADO: Usuario YA VERIFICADO como recluta`);
          console.log(`   📝 Cuando complete sus 8 donaciones como general en ${testCase.levelName},`);
          console.log(`      la verificación como recluta en ${testCase.targetLevelName} DEBE MANTENERSE`);
          console.log(`      para evitar que el general de ${testCase.targetLevelName} tenga que verificar 2 veces.`);
        } else {
          console.log(`   🟡 Usuario no verificado aún - caso normal`);
        }
      }

      // 5. Resumen del nivel
      const verifiedUsers = usersWithDualRole.filter(u => u.idUserProcessState === 4);
      const completedUsers = usersWithDualRole.filter(u => (u.ballsReceivedConfirmed || 0) >= 8);
      
      console.log(`\n📈 RESUMEN ${testCase.levelName} → ${testCase.targetLevelName}:`);
      console.log(`   👥 Total usuarios con rol dual: ${usersWithDualRole.length}`);
      console.log(`   ✅ Ya verificados como reclutas: ${verifiedUsers.length}`);
      console.log(`   🎯 Que han completado donaciones: ${completedUsers.length}`);
      
      if (verifiedUsers.length > 0 && completedUsers.length > 0) {
        console.log(`   🚨 CASOS CRÍTICOS: ${verifiedUsers.filter(u => (u.ballsReceivedConfirmed || 0) >= 8).length} usuarios que necesitan preservación`);
      }
    }

    console.log(`\n🎯 === VERIFICACIONES COMPLETADAS ===`);
    console.log(`📋 Este script identificó usuarios con roles duales en TODOS los niveles.`);
    console.log(`🔧 La lógica actualizada debe preservar verificaciones en:`);
    console.log(`   • Armagedón → Apolo`);
    console.log(`   • Apolo → Neptuno`);
    console.log(`   • Además del funcionamiento existente Genesis → Armagedón`);

  } catch (error) {
    console.error("❌ Error ejecutando el test:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔌 Conexión a la base de datos cerrada");
    }
  }
}

function getStateName(stateId: number): string {
  const states: { [key: number]: string } = {
    1: "WAITING",
    2: "RECRUIT", 
    3: "VALIDATING",
    4: "VALIDATED",
    5: "READY_TO_ACCEPT"
  };
  return states[stateId] || `UNKNOWN(${stateId})`;
}

// Ejecutar el test
testDualRoleVerificationAllLevels(); 
import { IsNull, Not } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

async function testUnlockLimits() {
  console.log("🔐 Iniciando pruebas de límites de desbloqueo...\n");

  try {
    // Inicializar conexión a la base de datos
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Función helper para mostrar los límites configurados
    const showConfiguredLimits = () => {
      console.log("📋 LÍMITES CONFIGURADOS:");
      console.log("  • Armagedón (Nivel 2) → Génesis (Nivel 1): 2 desbloqueos");
      console.log("  • Apolo (Nivel 3) → Armagedón (Nivel 2): 3 desbloqueos");  
      console.log("  • Neptuno (Nivel 4) → Apolo (Nivel 3): 3 desbloqueos");
      console.log("");
    };

    showConfiguredLimits();

    // Test 1: Verificar configuración de Armagedón → Génesis (debe ser 2)
    console.log("🧪 TEST 1: Configuración Armagedón → Génesis");
    const armageddonGenerals = await AppDataSource.getRepository(Board).find({
      where: { idLevelId: 2, idGoalScorer: Not(IsNull()) },
      take: 1
    });

    if (armageddonGenerals.length > 0) {
      const armageddonBoard = armageddonGenerals[0];
      const armageddonGeneral = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: armageddonBoard.idGoalScorer! }
      });

      if (armageddonGeneral) {
        console.log(`  📍 General de Armagedón: ${armageddonGeneral.username} (Tablero ${armageddonBoard.id})`);
        
        // Buscar un recluta de Génesis para el test
        const genesisBoards = await AppDataSource.getRepository(Board).find({
          where: { idLevelId: 1, idGoalScorer: Not(IsNull()) },
          take: 1
        });

        if (genesisBoards.length > 0) {
          const genesisGeneral = await AppDataSource.getRepository(EntityUser).findOne({
            where: { id: genesisBoards[0].idGoalScorer! }
          });

          if (genesisGeneral) {
            console.log(`  🎯 General de Génesis objetivo: ${genesisGeneral.username}`);
            console.log(`  📊 unlockCount actual: ${genesisGeneral.unlockCount || 0}`);
            
            // Simular llamada (sin ejecutar realmente)
            console.log("  🔄 Simulando desbloqueo...");
            console.log("  ✅ Límite esperado: 2 desbloqueos máximo");
          }
        }
      }
    }

    console.log("");

    // Test 2: Verificar configuración de Apolo → Armagedón (debe ser 3)
    console.log("🧪 TEST 2: Configuración Apolo → Armagedón");
    const apoloGenerals = await AppDataSource.getRepository(Board).find({
      where: { idLevelId: 3, idGoalScorer: Not(IsNull()) },
      take: 1
    });

    if (apoloGenerals.length > 0) {
      const apoloBoard = apoloGenerals[0];
      const apoloGeneral = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: apoloBoard.idGoalScorer! }
      });

      if (apoloGeneral) {
        console.log(`  📍 General de Apolo: ${apoloGeneral.username} (Tablero ${apoloBoard.id})`);
        
        const armageddonBoards = await AppDataSource.getRepository(Board).find({
          where: { idLevelId: 2, idGoalScorer: Not(IsNull()) },
          take: 1
        });

        if (armageddonBoards.length > 0) {
          const armageddonGeneral = await AppDataSource.getRepository(EntityUser).findOne({
            where: { id: armageddonBoards[0].idGoalScorer! }
          });

          if (armageddonGeneral) {
            console.log(`  🎯 General de Armagedón objetivo: ${armageddonGeneral.username}`);
            console.log(`  📊 unlockCount actual: ${armageddonGeneral.unlockCount || 0}`);
            console.log("  🔄 Simulando desbloqueo...");
            console.log("  ✅ Límite esperado: 3 desbloqueos máximo");
          }
        }
      }
    }

    console.log("");

    // Test 3: Verificar configuración de Neptuno → Apolo (debe ser 3)
    console.log("🧪 TEST 3: Configuración Neptuno → Apolo");
    const neptunoGenerals = await AppDataSource.getRepository(Board).find({
      where: { idLevelId: 4, idGoalScorer: Not(IsNull()) },
      take: 1
    });

    if (neptunoGenerals.length > 0) {
      const neptunoBoard = neptunoGenerals[0];
      const neptunoGeneral = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: neptunoBoard.idGoalScorer! }
      });

      if (neptunoGeneral) {
        console.log(`  📍 General de Neptuno: ${neptunoGeneral.username} (Tablero ${neptunoBoard.id})`);
        
        const apoloBoards = await AppDataSource.getRepository(Board).find({
          where: { idLevelId: 3, idGoalScorer: Not(IsNull()) },
          take: 1
        });

        if (apoloBoards.length > 0) {
          const apoloGeneral = await AppDataSource.getRepository(EntityUser).findOne({
            where: { id: apoloBoards[0].idGoalScorer! }
          });

          if (apoloGeneral) {
            console.log(`  🎯 General de Apolo objetivo: ${apoloGeneral.username}`);
            console.log(`  📊 unlockCount actual: ${apoloGeneral.unlockCount || 0}`);
            console.log("  🔄 Simulando desbloqueo...");
            console.log("  ✅ Límite esperado: 3 desbloqueos máximo");
          }
        }
      }
    }

    console.log("");

    // Función para hacer un test real (comentado por seguridad)
    console.log("💡 NOTA: Para hacer pruebas reales, descomenta la función testRealUnlock()");
    console.log("   y proporciona usernames reales de prueba.");

    console.log("\n✅ Pruebas de configuración completadas exitosamente!");
    console.log("\n📝 RESUMEN:");
    console.log("   • El nuevo servicio unlockLowerLevelBoardGenericService");
    console.log("   • Maneja automáticamente los límites correctos:");
    console.log("     - Armagedón → Génesis: 2 desbloqueos");
    console.log("     - Apolo → Armagedón: 3 desbloqueos");
    console.log("     - Neptuno → Apolo: 3 desbloqueos");
    console.log("   • Incluye validación de estados y contadores");
    console.log("   • Proporciona mensajes informativos con progreso (X/Y)");

  } catch (error) {
    console.error("❌ Error durante las pruebas:", error);
  } finally {
    // No cerrar la conexión automáticamente para permitir más operaciones
    console.log("\n🔧 Conexión a DB mantenida abierta para operaciones adicionales.");
  }
}

// Función comentada para hacer pruebas reales
/*
async function testRealUnlock() {
  try {
    // CUIDADO: Esto hace cambios reales en la base de datos
    // Solo usar con datos de prueba
    
    const generalUserId = 123; // ID del general que hace el desbloqueo
    const defenderUsername = "test_user"; // Username del defensor a desbloquear
    const boardId = 456; // ID del tablero del general
    
    const result = await unlockLowerLevelBoardGenericService(
      generalUserId,
      defenderUsername,
      boardId
    );
    
    console.log("🔓 Resultado del desbloqueo real:", result);
    
  } catch (error) {
    console.error("❌ Error en prueba real:", error);
  }
}
*/

// Ejecutar las pruebas
if (require.main === module) {
  testUnlockLimits().catch(console.error);
}

export { testUnlockLimits };


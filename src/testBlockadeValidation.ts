import { IsNull } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { unlockLowerLevelBoardGenericService } from "./services/board.service";

async function testBlockadeValidation() {
  console.log("🔐 Iniciando pruebas de validación de bloqueos...\n");

  try {
    console.log("🔌 Conectando a la base de datos...");
    // Inicializar conexión a la base de datos
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Conexión a la base de datos establecida");
    } else {
      console.log("✅ Base de datos ya inicializada");
    }

    console.log("📋 CASOS DE PRUEBA:");
    console.log("  1. ❌ Intentar desbloquear tablero en estado WAITING (sin bloqueo)");
    console.log("  2. ❌ Intentar desbloquear tablero BLOCKED pero sin etapa activa");
    console.log("  3. ❌ Armagedón intentar desbloquear etapa 3+ de Génesis (restricción específica)");
    console.log("  4. ✅ Desbloquear tablero BLOCKED con etapa de bloqueo activa válida\n");

    console.log("🔍 Buscando general de Armagedón...");
    // Buscar un general de Armagedón para las pruebas
    const armageddonBoard = await AppDataSource.getRepository(Board).findOne({
      where: { idLevelId: 2 }
    });

    console.log("📊 Resultado de búsqueda:", armageddonBoard ? "Encontrado" : "No encontrado");

    if (!armageddonBoard) {
      console.log("⚠️  No se encontró un general de Armagedón para las pruebas");
      return;
    }

    // Obtener el usuario general completo
    const generalUser = await AppDataSource.getRepository(EntityUser).findOne({
      where: { id: armageddonBoard.idGoalScorer as number }
    });

    if (!generalUser) {
      console.log("⚠️  No se encontró el usuario general para las pruebas");
      return;
    }

    const generalId = generalUser.id;
    console.log(`🎖️  Usando general: ID ${generalId} (${generalUser.username})`);

    // Caso 1: Intentar desbloquear un tablero que NO está bloqueado
    console.log("\n🧪 CASO 1: Tablero en estado WAITING (no bloqueado)");
    
    const waitingBoard = await AppDataSource.getRepository(Board).findOne({
      where: { 
        idLevelId: 1, // Génesis
        idBoardState: 1 // WAITING
      }
    });

    if (waitingBoard) {
      const defenderUser = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: waitingBoard.idGoalScorer as number }
      });

      if (defenderUser) {
        const defenderUsername = defenderUser.username;
        console.log(`   Intentando desbloquear a: ${defenderUsername}`);
        console.log(`   Estado del tablero: ${waitingBoard.idBoardState} (WAITING)`);
        console.log(`   Etapa de bloqueo: ${waitingBoard.currentBlockadeStage}`);

        const result1 = await unlockLowerLevelBoardGenericService(
          generalId,
          defenderUsername,
          armageddonBoard.id
        );

        console.log(`   Resultado: ${result1.success ? '✅ PERMITIDO' : '❌ RECHAZADO'}`);
        console.log(`   Mensaje: ${result1.message}`);
        if (result1.error) {
          console.log(`   Código de error: ${result1.error.code}`);
        }
      } else {
        console.log("   ⚠️  No se encontró el usuario del tablero WAITING");
      }
    } else {
      console.log("   ⚠️  No se encontró tablero en estado WAITING para probar");
    }

    // Caso 2: Tablero BLOCKED pero sin etapa de bloqueo activa
    console.log("\n🧪 CASO 2: Tablero BLOCKED pero sin etapa activa");
    
    const blockedNoStageBoard = await AppDataSource.getRepository(Board).findOne({
      where: { 
        idLevelId: 1, // Génesis
        idBoardState: 3, // BLOCKED
        currentBlockadeStage: IsNull()
      }
    });

    if (blockedNoStageBoard) {
      const defenderUser = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: blockedNoStageBoard.idGoalScorer as number }
      });

      if (defenderUser) {
        const defenderUsername = defenderUser.username;
        console.log(`   Intentando desbloquear a: ${defenderUsername}`);
        console.log(`   Estado del tablero: ${blockedNoStageBoard.idBoardState} (BLOCKED)`);
        console.log(`   Etapa de bloqueo: ${blockedNoStageBoard.currentBlockadeStage} (null)`);

        const result2 = await unlockLowerLevelBoardGenericService(
          generalId,
          defenderUsername,
          armageddonBoard.id
        );

        console.log(`   Resultado: ${result2.success ? '✅ PERMITIDO' : '❌ RECHAZADO'}`);
        console.log(`   Mensaje: ${result2.message}`);
        if (result2.error) {
          console.log(`   Código de error: ${result2.error.code}`);
        }
      } else {
        console.log("   ⚠️  No se encontró el usuario del tablero BLOCKED sin etapa");
      }
    } else {
      console.log("   ⚠️  No se encontró tablero BLOCKED sin etapa activa para probar");
    }

    // Caso 3: Armagedón intentando desbloquear etapa 3+ de Génesis (debe ser rechazado)
    console.log("\n🧪 CASO 3: Armagedón intentando desbloquear etapa 3+ de Génesis");
    
    const genesisStage3Board = await AppDataSource.getRepository(Board).findOne({
      where: { 
        idLevelId: 1, // Génesis
        idBoardState: 3, // BLOCKED
        currentBlockadeStage: 3 // Etapa 3 (prohibida para Armagedón)
      }
    });

    if (genesisStage3Board) {
      const defenderUser = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: genesisStage3Board.idGoalScorer as number }
      });

      if (defenderUser) {
        const defenderUsername = defenderUser.username;
        console.log(`   Intentando desbloquear a: ${defenderUsername}`);
        console.log(`   Estado del tablero: ${genesisStage3Board.idBoardState} (BLOCKED)`);
        console.log(`   Etapa de bloqueo: ${genesisStage3Board.currentBlockadeStage} (etapa 3 - PROHIBIDA para Armagedón)`);

        const result3 = await unlockLowerLevelBoardGenericService(
          generalId,
          defenderUsername,
          armageddonBoard.id
        );

        console.log(`   Resultado: ${result3.success ? '✅ PERMITIDO' : '❌ RECHAZADO'}`);
        console.log(`   Mensaje: ${result3.message}`);
        if (result3.error) {
          console.log(`   Código de error: ${result3.error.code}`);
        }
      } else {
        console.log("   ⚠️  No se encontró el usuario del tablero Génesis etapa 3");
      }
    } else {
      console.log("   ⚠️  No se encontró tablero Génesis en etapa 3 para probar");
    }

    // Caso 4: Tablero BLOCKED con etapa de bloqueo activa válida (caso válido)
    console.log("\n🧪 CASO 4: Tablero BLOCKED con etapa activa válida (caso válido)");
    
    const validBlockedBoard = await AppDataSource.getRepository(Board).findOne({
      where: { 
        idLevelId: 1, // Génesis
        idBoardState: 3, // BLOCKED
        currentBlockadeStage: 1 // Etapa 1 o 2 (válidas para Armagedón)
      }
    });

    // Si no encuentra etapa 1, buscar etapa 2
    const validBlockedBoardStage2 = !validBlockedBoard ? await AppDataSource.getRepository(Board).findOne({
      where: { 
        idLevelId: 1, // Génesis
        idBoardState: 3, // BLOCKED
        currentBlockadeStage: 2 // Etapa 2 (válida para Armagedón)
      }
    }) : null;

    const finalValidBoard = validBlockedBoard || validBlockedBoardStage2;

    if (finalValidBoard && finalValidBoard.currentBlockadeStage) {
      const defenderUser = await AppDataSource.getRepository(EntityUser).findOne({
        where: { id: finalValidBoard.idGoalScorer as number }
      });

      if (defenderUser) {
        const defenderUsername = defenderUser.username;
        console.log(`   Intentando desbloquear a: ${defenderUsername}`);
        console.log(`   Estado del tablero: ${finalValidBoard.idBoardState} (BLOCKED)`);
        console.log(`   Etapa de bloqueo: ${finalValidBoard.currentBlockadeStage} (activa)`);

        const result4 = await unlockLowerLevelBoardGenericService(
          generalId,
          defenderUsername,
          armageddonBoard.id
        );

        console.log(`   Resultado: ${result4.success ? '✅ PERMITIDO' : '❌ RECHAZADO'}`);
        console.log(`   Mensaje: ${result4.message}`);
        if (result4.error) {
          console.log(`   Código de error: ${result4.error.code}`);
        }
        
        // 🔍 NUEVA VERIFICACIÓN: Comprobar que el tablero fue desbloqueado
        if (result4.success && result4.data) {
          console.log(`   📊 Información del desbloqueo:`);
          console.log(`     - UnlockCount: ${result4.data.unlockCount}/${result4.data.maxUnlocks}`);
          
          if (result4.data.targetBoardUnlocked) {
            console.log(`     - ✅ Tablero ${result4.data.targetBoardId} desbloqueado`);
            console.log(`     - 📋 Nivel: ${result4.data.targetBoardLevel}`);
            console.log(`     - 🔄 Estado: ${result4.data.targetBoardPreviousState} → ${result4.data.targetBoardNewState}`);
            
            // Verificar en la base de datos que realmente se desbloqueó
            const verifyBoard = await AppDataSource.getRepository(Board).findOne({
              where: { id: result4.data.targetBoardId }
            });
            
            if (verifyBoard) {
              console.log(`     - 🔍 Verificación DB: Estado=${verifyBoard.idBoardState}, Etapa=${verifyBoard.currentBlockadeStage}`);
              if (verifyBoard.idBoardState === 1 && verifyBoard.currentBlockadeStage === null) {
                console.log(`     - ✅ CONFIRMADO: Tablero correctamente desbloqueado en BD`);
              } else {
                console.log(`     - ❌ ERROR: Tablero NO fue desbloqueado en BD`);
              }
            }
          } else {
            console.log(`     - ⚠️ targetBoardUnlocked: false o undefined`);
          }
        }
      } else {
        console.log("   ⚠️  No se encontró el usuario del tablero BLOCKED válido");
      }
    } else {
      console.log("   ⚠️  No se encontró tablero BLOCKED con etapa activa para probar");
    }

    console.log("\n✅ Pruebas de validación completadas");
    console.log("\n📊 RESUMEN:");
    console.log("Los casos 1, 2 y 3 deben ser RECHAZADOS ❌");
    console.log("Solo el caso 4 debe ser PERMITIDO ✅");
    console.log("Caso 3 específicamente valida la restricción de Armagedón (solo etapas 1-2 de Génesis)");
    console.log("Si algún caso no válido fue permitido, hay un problema de seguridad.");

  } catch (error) {
    console.error("Error durante las pruebas:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar las pruebas
testBlockadeValidation(); 
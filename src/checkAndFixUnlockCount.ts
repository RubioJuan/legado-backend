import { IsNull, Not } from "typeorm";
import { AppDataSource } from "./config/db";
import { EntityUser } from "./entities/user.entity";

async function checkAndFixUnlockCount() {
  try {
    await AppDataSource.initialize();
    console.log("=== CHECK AND FIX UNLOCK COUNT FOR DUAL ROLES ===\n");
    
    // Buscar usuarios con roles duales (que tengan secondaryBoardIdAsRecruit no nulo)
    const dualRoleUsers = await AppDataSource.manager.find(EntityUser, {
      where: {
        secondaryBoardIdAsRecruit: Not(IsNull())
      },
      select: [
        "id", 
        "username", 
        "unlockCount", 
        "secondaryBoardIdAsRecruit", 
        "secondaryBoardLevelIdAsRecruit", 
        "secondaryPositionAsRecruit",
        "idUserProcessState"
      ]
    });
    
    console.log(`📊 Encontrados ${dualRoleUsers.length} usuarios con roles duales\n`);
    
    let needsFixCount = 0;
    let alreadyCorrectCount = 0;
    let fixedCount = 0;
    
    // FASE 1: ANÁLISIS
    console.log("=== FASE 1: ANÁLISIS ===");
    for (const user of dualRoleUsers) {
      console.log(`👤 Usuario: ${user.username} (ID: ${user.id})`);
      console.log(`   🎯 Rol dual: Board ${user.secondaryBoardIdAsRecruit}, Level ${user.secondaryBoardLevelIdAsRecruit}`);
      console.log(`   📍 Posición: ${user.secondaryPositionAsRecruit}`);
      console.log(`   🔓 UnlockCount: ${user.unlockCount}`);
      console.log(`   ⚡ Estado: ${user.idUserProcessState}`);
      
      if (user.unlockCount > 0) {
        console.log(`   ❌ PROBLEMA: UnlockCount = ${user.unlockCount} (debería ser 0 para nuevo rol dual)`);
        needsFixCount++;
      } else {
        console.log(`   ✅ OK: UnlockCount correcto`);
        alreadyCorrectCount++;
      }
      console.log("");
    }
    
    // FASE 2: CORRECCIÓN
    if (needsFixCount > 0) {
      console.log(`\n=== FASE 2: CORRECCIÓN ===`);
      console.log(`🔧 Corrigiendo ${needsFixCount} usuarios...\n`);
      
      for (const user of dualRoleUsers) {
        if (user.unlockCount > 0) {
          console.log(`🔧 Corrigiendo ${user.username} (ID: ${user.id})`);
          console.log(`   📉 ${user.unlockCount} → 0`);
          
          await AppDataSource.manager.update(EntityUser, user.id, {
            unlockCount: 0
          });
          
          fixedCount++;
          console.log(`   ✅ Corregido exitosamente\n`);
        }
      }
    }
    
    // RESUMEN FINAL
    console.log("=== RESUMEN FINAL ===");
    console.log(`📊 Total usuarios duales: ${dualRoleUsers.length}`);
    console.log(`✅ Ya correctos: ${alreadyCorrectCount}`);
    console.log(`🔧 Necesitaban corrección: ${needsFixCount}`);
    console.log(`✅ Corregidos exitosamente: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log(`\n🎯 RESULTADO: ${fixedCount} usuarios duales ahora pueden ser desbloqueados correctamente por sus Generales superiores.`);
      console.log(`📋 PRÓXIMOS PASOS: Los Generales de niveles superiores ahora podrán desbloquear a estos reclutas duales.`);
    } else if (needsFixCount === 0) {
      console.log(`\n✅ RESULTADO: Todos los usuarios duales ya tenían unlockCount correcto (0).`);
    }
    
  } catch (error) {
    console.error("❌ Error ejecutando el script:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Ejecutar el script
checkAndFixUnlockCount(); 
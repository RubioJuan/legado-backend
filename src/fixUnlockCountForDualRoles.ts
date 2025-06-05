import { AppDataSource } from "./config/db";
import { EntityUser } from "./entities/user.entity";

async function fixUnlockCountForDualRoles() {
  try {
    await AppDataSource.initialize();
    console.log("=== FIX UNLOCK COUNT FOR DUAL ROLES ===");
    
    // Buscar todos los usuarios que tienen roles duales activos
    const dualRoleUsers = await AppDataSource.manager.find(EntityUser, {
      where: {
        // Usuarios que tienen campos de rol dual poblados
        // Esto indica que son jugadores duales activos
      },
      select: [
        "id", 
        "username", 
        "unlockCount", 
        "secondaryBoardIdAsRecruit", 
        "secondaryBoardLevelIdAsRecruit", 
        "secondaryPositionAsRecruit"
      ]
    });
    
    // Filtrar solo usuarios que realmente tienen rol dual
    const actualDualRoleUsers = dualRoleUsers.filter(user => 
      user.secondaryBoardIdAsRecruit !== null && 
      user.secondaryBoardLevelIdAsRecruit !== null && 
      user.secondaryPositionAsRecruit !== null
    );
    
    console.log(`Encontrados ${actualDualRoleUsers.length} usuarios con roles duales activos`);
    
    let fixedCount = 0;
    let alreadyCorrectCount = 0;
    
    for (const user of actualDualRoleUsers) {
      console.log(`\n--- Usuario: ${user.username} (ID: ${user.id}) ---`);
      console.log(`  Rol dual: Board ${user.secondaryBoardIdAsRecruit}, Level ${user.secondaryBoardLevelIdAsRecruit}, Position ${user.secondaryPositionAsRecruit}`);
      console.log(`  UnlockCount actual: ${user.unlockCount}`);
      
      if (user.unlockCount > 0) {
        // Resetear a 0 para que el General del nivel superior pueda desbloquearlo
        await AppDataSource.manager.update(EntityUser, user.id, {
          unlockCount: 0
        });
        
        console.log(`  ✅ FIXED: UnlockCount resetado de ${user.unlockCount} → 0`);
        fixedCount++;
      } else {
        console.log(`  ✓ OK: UnlockCount ya está en 0`);
        alreadyCorrectCount++;
      }
    }
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`✅ Usuarios corregidos: ${fixedCount}`);
    console.log(`✓ Usuarios ya correctos: ${alreadyCorrectCount}`);
    console.log(`📊 Total procesados: ${actualDualRoleUsers.length}`);
    
    if (fixedCount > 0) {
      console.log(`\n🎯 RESULTADO: ${fixedCount} usuarios duales ahora pueden ser desbloqueados correctamente por sus Generales.`);
    } else {
      console.log(`\n✅ RESULTADO: Todos los usuarios duales ya tenían unlockCount correcto.`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Ejecutar el script
fixUnlockCountForDualRoles(); 
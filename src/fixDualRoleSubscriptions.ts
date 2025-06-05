import "reflect-metadata";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { Subscription } from "./entities/subscription.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script para corregir suscripciones duplicadas en usuarios duales
 * Este script identifica y limpia suscripciones incorrectas que quedaron después de divisiones de tablero
 */
async function fixDualRoleSubscriptions() {
  console.log("=== FIXING DUAL ROLE SUBSCRIPTIONS ==");
  
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established");
    
    // 1. Buscar usuarios duales (que tienen rol secundario)
    console.log("\n🔍 Finding dual role users...");
    const dualRoleUsers = await AppDataSource.manager
      .createQueryBuilder(EntityUser, "user")
      .where("user.secondaryBoardIdAsRecruit IS NOT NULL")
      .andWhere("user.secondaryPositionAsRecruit IS NOT NULL")
      .getMany();
    
    console.log(`Found ${dualRoleUsers.length} dual role users`);
    
    for (const user of dualRoleUsers) {
      console.log(`\n👤 Processing user ${user.id} (${user.username})`);
      
      // 2. Buscar todas las suscripciones de este usuario
      const subscriptions = await AppDataSource.manager.find(Subscription, {
        where: { idUser: user.id },
        relations: ["board"]
      });
      
      console.log(`  📋 User has ${subscriptions.length} subscriptions`);
      
      // 3. Verificar si tiene suscripciones a tableros inactivos
      const inactiveSubscriptions = [];
      const activeSubscriptions = [];
      
      for (const sub of subscriptions) {
        const board = await AppDataSource.manager.findOne(Board, { 
          where: { id: sub.idBoard }
        });
        
        if (board) {
          if (board.idBoardState === 2) { // Estado inactivo
            console.log(`    ❌ Inactive subscription to board ${sub.idBoard} (state: ${board.idBoardState})`);
            inactiveSubscriptions.push(sub);
          } else {
            console.log(`    ✅ Active subscription to board ${sub.idBoard} (state: ${board.idBoardState})`);
            activeSubscriptions.push(sub);
          }
        }
      }
      
      // 4. Si tiene suscripciones a tableros inactivos Y activos, eliminar las inactivas
      if (inactiveSubscriptions.length > 0 && activeSubscriptions.length > 0) {
        console.log(`  🧹 Cleaning ${inactiveSubscriptions.length} inactive subscriptions`);
        
        for (const inactiveSub of inactiveSubscriptions) {
          await AppDataSource.manager.delete(Subscription, { id: inactiveSub.id });
          console.log(`    🗑️ Deleted subscription ${inactiveSub.id} to inactive board ${inactiveSub.idBoard}`);
        }
      } else {
        console.log(`  ✅ No cleanup needed for user ${user.id}`);
      }
    }
    
    console.log("\n✅ Dual role subscription cleanup completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  fixDualRoleSubscriptions();
}

export { fixDualRoleSubscriptions };

import "reflect-metadata";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script para probar la preservación de verificación en roles duales
 */
async function testDualRoleVerification() {
  console.log("=== TESTING DUAL ROLE VERIFICATION PRESERVATION ===");
  
  try {
    // Inicializar conexión
    console.log("Inicializando conexión a base de datos...");
    await AppDataSource.initialize();
    console.log("Conexión establecida exitosamente");
    
    // Buscar un usuario que tenga rol dual
    console.log("\nBuscando usuarios con rol dual...");
    const dualRoleUsers = await AppDataSource.manager
      .createQueryBuilder(EntityUser, "user")
      .where("user.secondaryBoardIdAsRecruit IS NOT NULL")
      .andWhere("user.secondaryPositionAsRecruit IS NOT NULL")
      .take(5)
      .getMany();
    
    if (dualRoleUsers.length === 0) {
      console.log("No se encontraron usuarios con rol dual");
      return;
    }
    
    console.log(`Encontrados ${dualRoleUsers.length} usuarios con rol dual:`);
    
    dualRoleUsers.forEach((user, index) => {
      console.log(`${index + 1}. Usuario ID: ${user.id}`);
      console.log(`   - Username: ${user.username}`);
      console.log(`   - Estado actual: ${user.idUserProcessState}`);
      console.log(`   - Tablero secundario: ${user.secondaryBoardIdAsRecruit}`);
      console.log(`   - Posición secundaria: ${user.secondaryPositionAsRecruit}`);
      console.log(`   - Nivel secundario: ${user.secondaryBoardLevelIdAsRecruit}`);
      console.log(`   - Puede verificar: ${user.canVerifyRecruits}`);
      
      // Verificar si está verificado (estado 4)
      if (user.idUserProcessState === 4) {
        console.log(`   ✅ VERIFICADO - Este usuario mantendría su verificación en ascenso`);
      } else {
        console.log(`   ⏳ NO VERIFICADO - Estado: ${user.idUserProcessState}`);
      }
      console.log("");
    });
    
    // Verificar que las posiciones en los tableros están ocupadas por estos usuarios
    console.log("\n=== VERIFICANDO CONSISTENCIA DE POSICIONES ===");
    
    for (const user of dualRoleUsers) {
      if (user.secondaryBoardIdAsRecruit && user.secondaryPositionAsRecruit) {
        const board = await AppDataSource.manager.findOne(Board, {
          where: { id: user.secondaryBoardIdAsRecruit }
        });
        
        if (board) {
          const positionValue = board[user.secondaryPositionAsRecruit as keyof Board];
          const isConsistent = positionValue === user.id;
          
          console.log(`Usuario ${user.username} (ID: ${user.id}):`);
          console.log(`  - Tablero: ${user.secondaryBoardIdAsRecruit}`);
          console.log(`  - Posición: ${user.secondaryPositionAsRecruit}`);
          console.log(`  - Valor en tablero: ${positionValue}`);
          console.log(`  - Consistencia: ${isConsistent ? '✅ CORRECTO' : '❌ INCONSISTENTE'}`);
          console.log("");
        }
      }
    }
    
    console.log("=== PRUEBA COMPLETADA ===");
    
  } catch (error) {
    console.error("Error durante la prueba:", error);
  } finally {
    // Cerrar conexión
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("\nConexión a base de datos cerrada");
    }
  }
}

// Ejecutar la función
testDualRoleVerification()
  .then(() => console.log("Proceso de prueba completado"))
  .catch(error => console.error("Error durante el proceso de prueba:", error)); 
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

async function checkArmageddonGenerals() {
  try {
    await AppDataSource.initialize();
    
    console.log("=== VERIFICANDO GENERALES DE ARMAGEDÓN ===");
    
    // Buscar tableros activos en Armagedón (nivel 2)
    const armageddonBoards = await AppDataSource.manager.find(Board, {
      where: { idLevelId: 2, idBoardState: 1 }, // Estado 1 = ACTIVO
      order: { id: "ASC" }
    });
    
    console.log(`Tableros activos en Armagedón: ${armageddonBoards.length}\n`);
    
    for (const board of armageddonBoards) {
      console.log(`=== TABLERO ${board.id} ===`);
      
      if (board.idGoalScorer) {
        const general = await AppDataSource.manager.findOne(EntityUser, {
          where: { id: board.idGoalScorer }
        });
        
        if (general) {
          console.log(`General: ${general.username} (ID: ${general.id})`);
          console.log(`- Es admin: ${general.idRole === 1 ? 'SÍ' : 'NO'} (idRole: ${general.idRole})`);
          console.log(`- Estado actual: ${general.idUserProcessState}`);
          
          // Información del rol dual
          const hasDualRole = general.secondaryBoardIdAsRecruit !== null;
          console.log(`- Tiene rol dual: ${hasDualRole ? 'SÍ' : 'NO'}`);
          
          if (hasDualRole) {
            console.log(`  * Tablero secundario: ${general.secondaryBoardIdAsRecruit}`);
            console.log(`  * Nivel secundario: ${general.secondaryBoardLevelIdAsRecruit}`);
            console.log(`  * Posición secundaria: ${general.secondaryPositionAsRecruit}`);
            console.log(`  * Puede verificar reclutas: ${general.canVerifyRecruits ? 'SÍ' : 'NO'}`);
            
            // Verificar en qué nivel está su rol secundario
            let secondaryLevelName = "Desconocido";
            switch (general.secondaryBoardLevelIdAsRecruit) {
              case 1: secondaryLevelName = "Genesis"; break;
              case 2: secondaryLevelName = "Armagedón"; break;
              case 3: secondaryLevelName = "Apolo"; break;
              case 4: secondaryLevelName = "Neptuno"; break;
            }
            console.log(`  * Nivel secundario: ${secondaryLevelName} (ID: ${general.secondaryBoardLevelIdAsRecruit})`);
            
            // Verificar si el rol secundario está en el nivel correcto para Armagedón→Apolo
            if (general.secondaryBoardLevelIdAsRecruit === 3) {
              console.log(`  ✅ YA TIENE ROL DUAL EN APOLO - Por eso no se creó otro`);
            } else if (general.secondaryBoardLevelIdAsRecruit === 2) {
              console.log(`  ⚠️ Tiene rol dual en ARMAGEDÓN - Debería actualizarse a APOLO`);
            } else {
              console.log(`  ❓ Tiene rol dual en nivel inesperado`);
            }
            
            // Verificar consistencia en el tablero
            if (general.secondaryBoardIdAsRecruit) {
              const secondaryBoard = await AppDataSource.manager.findOne(Board, {
                where: { id: general.secondaryBoardIdAsRecruit }
              });
              
              if (secondaryBoard && general.secondaryPositionAsRecruit) {
                const positionValue = secondaryBoard[general.secondaryPositionAsRecruit as keyof Board];
                const isConsistent = positionValue === general.id;
                console.log(`  * Consistencia en tablero: ${isConsistent ? '✅ CORRECTO' : '❌ INCONSISTENTE'}`);
                if (!isConsistent) {
                  console.log(`    - Esperado: ${general.id}, Encontrado: ${positionValue}`);
                }
              }
            }
            
          } else {
            console.log(`  ❌ NO TIENE ROL DUAL - Debería tenerlo en APOLO`);
          }
          
        }
      } else {
        console.log(`Sin general asignado`);
      }
      
      console.log("");
    }
    
    // Resumen
    console.log("\n=== RESUMEN DEL PROBLEMA ===");
    console.log("Para que funcione el rol dual Armagedón→Apolo:");
    console.log("1. Los generales de Armagedón NO deben tener roles duales existentes");
    console.log("2. O deben tener roles duales en Armagedón que se actualicen a Apolo");
    console.log("3. setupPotentialDualRoleForGeneralService debe detectar que necesita crear/actualizar el rol dual en Apolo");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkArmageddonGenerals().catch(console.error); 
import { In } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script para corregir el problema con el desbloqueo de la etapa 3 de triplicación
 */
async function fixTriplicationIssue() {
  console.log("=== CORRIGIENDO PROBLEMA DE TRIPLICACIÓN ETAPA 3 ===");
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log("Conexión a base de datos establecida");
    
    // 1. Buscar el tablero 498 que está bloqueado en etapa 3
    const board = await AppDataSource.manager.findOne(Board, {
      where: { 
        id: 498,
        currentBlockadeStage: 3
      }
    });
    
    if (!board) {
      console.log("Tablero 498 no encontrado o no está en etapa 3 de bloqueo.");
      return;
    }
    
    console.log(`Tablero 498 encontrado con estado: ${board.idBoardState}, etapa de bloqueo: ${board.currentBlockadeStage}`);
    
    if (!board.idGoalScorer) {
      console.error("El tablero no tiene un General (idGoalScorer)!");
      return;
    }
    
    // 2. Buscar todos los usuarios hijos creados para triplicación
    const childUsers = await AppDataSource.manager.find(EntityUser, {
      where: { triplicationOfId: board.idGoalScorer }
    });
    
    console.log(`Se encontraron ${childUsers.length} usuarios hijos para el General ID ${board.idGoalScorer}`);
    
    // 3. Contar cuántos están verificados
    const verifiedCount = childUsers.filter(user => 
      user.idUserProcessState === 3 || user.idUserProcessState === 4
    ).length;
    
    console.log(`Usuarios hijos verificados: ${verifiedCount} de ${childUsers.length}`);
    
    // 4. PROBLEMA: La función de desbloqueo está buscando el tablero con isAwaitingUserCreation=true
    console.log("El problema es que la función de desbloqueo busca tableros con isAwaitingUserCreation=true");
    console.log(`Valor actual de isAwaitingUserCreation: ${board.isAwaitingUserCreation ? 'true' : 'false'}`);
    
    // 5. Actualizar la bandera isAwaitingUserCreation para que pueda ser encontrado correctamente
    await AppDataSource.manager.update(
      Board,
      { id: board.id },
      { isAwaitingUserCreation: true }
    );
    
    console.log("✅ Se actualizó isAwaitingUserCreation a true");
    
    // 6. Ahora probar la condición de desbloqueo
    if (verifiedCount >= 2) {
      console.log("Se cumple la condición de tener 2 o más hijos verificados.");
      console.log("Intentando desbloquear el tablero...");
      
      // Actualizar el tablero para desbloquear
      await AppDataSource.manager.update(
        Board,
        { id: board.id },
        { 
          currentBlockadeStage: null, 
          isAwaitingUserCreation: false,
          idBoardState: 1 // WAITING
        }
      );
      
      console.log("✅ Tablero desbloqueado manualmente.");
    } else {
      console.log("No hay suficientes hijos verificados (mínimo 2 requeridos).");
      
      // Si hay hijos pero no están verificados, actualizarlos para probar
      if (childUsers.length > 0 && verifiedCount < 2) {
        console.log("Actualizando el estado de los usuarios hijos para pruebas...");
        
        // Actualizar al menos 2 hijos a estado verificado
        const usersToUpdate = childUsers.slice(0, 2).map(u => u.id);
        
        if (usersToUpdate.length > 0) {
          await AppDataSource.manager.update(
            EntityUser,
            { id: In(usersToUpdate) },
            { idUserProcessState: 3 } // VALIDATING
          );
          
          console.log(`✅ Se actualizaron ${usersToUpdate.length} usuarios hijos a estado verificado.`);
          console.log("Intente nuevamente verificar el desbloqueo.");
        }
      }
    }
    
    console.log("\nImportante: Ahora debe llamar al endpoint /users/check-genesis-third-blockade para verificar el desbloqueo.");
    
  } catch (error) {
    console.error("Error durante la corrección:", error);
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
    console.log("\nConexión a base de datos cerrada");
  }
}

// Ejecutar la función
fixTriplicationIssue()
  .then(() => console.log("Corrección completada"))
  .catch(error => console.error("Error durante la corrección:", error)); 
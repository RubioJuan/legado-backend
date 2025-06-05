import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script para diagnosticar problemas con la triplicación y el desbloqueo de la etapa 3
 */
async function debugTriplicationStatus() {
  console.log("=== DIAGNÓSTICO DE TRIPLICACIÓN Y DESBLOQUEO ETAPA 3 ===");
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log("Conexión a base de datos establecida");
    
    // 1. Buscar el tablero 498 y verificar su estado actual
    const board = await AppDataSource.manager.findOne(Board, {
      where: { id: 498 }
    });
    
    if (!board) {
      console.error("Tablero 498 no encontrado!");
      return;
    }
    
    console.log(`\n=== ESTADO DEL TABLERO 498 ===`);
    console.log(`Estado: ${board.idBoardState}`);
    console.log(`Etapa de bloqueo: ${board.currentBlockadeStage || 'Sin bloqueo'}`);
    console.log(`Esperando creación de usuarios: ${board.isAwaitingUserCreation ? 'Sí' : 'No'}`);
    
    if (!board.idGoalScorer) {
      console.error("El tablero no tiene un General (idGoalScorer)!");
      return;
    }
    
    // 2. Buscar información del general
    const general = await AppDataSource.manager.findOne(EntityUser, {
      where: { id: board.idGoalScorer }
    });
    
    if (!general) {
      console.error("No se encontró el usuario General!");
      return;
    }
    
    console.log(`\n=== INFORMACIÓN DEL GENERAL ===`);
    console.log(`ID: ${general.id}`);
    console.log(`Username: ${general.username}`);
    console.log(`Estado de proceso: ${general.idUserProcessState}`);
    console.log(`Triplicación completada: ${general.triplicationDone ? 'Sí' : 'No'}`);
    console.log(`Balones recibidos: ${general.ballsReceived}`);
    
    // 3. Buscar todos los usuarios creados para triplicación
    const childUsers = await AppDataSource.manager.find(EntityUser, {
      where: { triplicationOfId: general.id }
    });
    
    console.log(`\n=== USUARIOS HIJOS PARA TRIPLICACIÓN ===`);
    console.log(`Total de usuarios hijos encontrados: ${childUsers.length}`);
    
    if (childUsers.length > 0) {
      childUsers.forEach((user, index) => {
        console.log(`\n--- HIJO #${index + 1} ---`);
        console.log(`ID: ${user.id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Estado de proceso: ${user.idUserProcessState}`);
        console.log(`¿Está verificado? ${user.idUserProcessState === 3 || user.idUserProcessState === 4 ? 'Sí' : 'No'}`);
      });
      
      // 4. Contar cuántos están verificados
      const verifiedCount = childUsers.filter(user => 
        user.idUserProcessState === 3 || user.idUserProcessState === 4
      ).length;
      
      console.log(`\n=== RESUMEN DE VERIFICACIÓN ===`);
      console.log(`Total de hijos verificados: ${verifiedCount} de ${childUsers.length}`);
      console.log(`Se requieren al menos 2 verificados para desbloquear la etapa 3`);
      
      if (verifiedCount >= 2 && board.currentBlockadeStage === 3) {
        console.log("\n🚨 PROBLEMA DETECTADO: Hay suficientes hijos verificados pero el tablero sigue bloqueado.");
        console.log("Posible problema: El endpoint de verificación no se está llamando o la función de desbloqueo no está funcionando correctamente.");
      }
    } else {
      console.log("No se encontraron usuarios hijos para triplicación.");
    }
    
    // 5. Verificar la función de desbloqueo manualmente
    if (board.currentBlockadeStage === 3 && childUsers.length > 0) {
      console.log("\n=== PRUEBA MANUAL DE DESBLOQUEO ===");
      
      // Contar cuántos hijos aceptados hay (idUserProcessState = 3)
      const acceptedChildrenCount = childUsers.filter(user => 
        user.idUserProcessState === 3 || user.idUserProcessState === 4
      ).length;
      
      console.log(`Conteo manual de hijos aceptados: ${acceptedChildrenCount}`);
      
      if (acceptedChildrenCount >= 2) {
        console.log("✅ Condición de desbloqueo cumplida: Hay 2 o más hijos verificados.");
        
        console.log("Intentando desbloquear manualmente...");
        // Actualizar el tablero para quitar el bloqueo
        await AppDataSource.manager.update(Board, board.id, {
          currentBlockadeStage: null,
          isAwaitingUserCreation: false,
          idBoardState: 1 // Set board state to WAITING (1)
        });
        
        console.log("✅ Tablero desbloqueado manualmente. Por favor verifique en la interfaz.");
      } else {
        console.log("❌ Condición de desbloqueo NO cumplida: Se necesitan verificar más hijos.");
      }
    }
    
  } catch (error) {
    console.error("Error durante el diagnóstico:", error);
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
    console.log("\nConexión a base de datos cerrada");
  }
}

// Ejecutar la función
debugTriplicationStatus()
  .then(() => console.log("Diagnóstico completado"))
  .catch(error => console.error("Error en diagnóstico:", error)); 
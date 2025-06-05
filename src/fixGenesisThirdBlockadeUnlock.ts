import * as fs from 'fs';
import * as path from 'path';
import "reflect-metadata";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script para diagnosticar y corregir el problema de desbloqueo de la etapa 3 en Génesis
 * cuando se verifican los usuarios hijos en otros tableros
 */
async function fixGenesisThirdBlockadeUnlock() {
  const logFile = path.join(__dirname, 'genesis_blockade_fix.log');
  const log = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
    console.log(message);
  };

  log("=== DIAGNÓSTICO Y CORRECCIÓN DE DESBLOQUEO ETAPA 3 GÉNESIS ===");
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    log("Conexión a base de datos establecida");
    
    // 1. Buscar todos los tableros Génesis bloqueados en etapa 3
    const blockedBoards = await AppDataSource.manager.find(Board, {
      where: {
        idLevelId: 1, // Génesis
        currentBlockadeStage: 3,
        idBoardState: 3 // Bloqueado
      }
    });
    
    log(`\nSe encontraron ${blockedBoards.length} tableros Génesis bloqueados en etapa 3`);
    
    for (const board of blockedBoards) {
      log(`\n=== Procesando tablero ${board.id} ===`);
      
      if (!board.idGoalScorer) {
        log(`- ERROR: Tablero ${board.id} no tiene general asignado`);
        continue;
      }
      
      // Obtener información del general
      const general = await AppDataSource.manager.findOne(EntityUser, {
        where: { id: board.idGoalScorer }
      });

      if (!general) {
        log(`- ERROR: No se encontró el usuario general con ID ${board.idGoalScorer}`);
        continue;
      }

      log(`- General ID: ${board.idGoalScorer}`);
      log(`- General Username: ${general.username}`);
      log(`- General Estado: ${general.idUserProcessState}`);
      log(`- General Triplicación completada: ${general.triplicationDone ? 'Sí' : 'No'}`);
      
      // 2. Para cada tablero, buscar los usuarios hijos del general
      const childUsers = await AppDataSource.manager.find(EntityUser, {
        where: { triplicationOfId: board.idGoalScorer }
      });
      
      log(`- Usuarios hijos encontrados: ${childUsers.length}`);
      
      if (childUsers.length === 0) {
        log("  ⚠️ No se encontraron usuarios hijos para este general");
        continue;
      }
      
      // 3. Contar cuántos están verificados
      const verifiedUsers = childUsers.filter(user => 
        user.idUserProcessState === 3 || user.idUserProcessState === 4
      );
      
      log(`- Usuarios hijos verificados: ${verifiedUsers.length} de ${childUsers.length}`);
      
      // Mostrar detalles de cada hijo
      childUsers.forEach((user, index) => {
        log(`  Hijo #${index + 1}:`);
        log(`    ID: ${user.id}`);
        log(`    Username: ${user.username}`);
        log(`    Estado: ${user.idUserProcessState}`);
        log(`    Verificado: ${user.idUserProcessState === 3 || user.idUserProcessState === 4 ? 'Sí' : 'No'}`);
      });
      
      // 4. Si hay 2 o más verificados, desbloquear el tablero
      if (verifiedUsers.length >= 2) {
        log("  ✅ Condición de desbloqueo cumplida (2 o más hijos verificados)");
        log("  🔄 Desbloqueando tablero...");
        
        try {
          await AppDataSource.manager.update(
            Board,
            { id: board.id },
            {
              currentBlockadeStage: null,
              idBoardState: 1, // WAITING
              isAwaitingUserCreation: false
            }
          );
          
          log("  ✅ Tablero desbloqueado exitosamente");
          
          // Verificar el desbloqueo
          const updatedBoard = await AppDataSource.manager.findOne(Board, {
            where: { id: board.id }
          });
          
          if (updatedBoard?.idBoardState === 1 && updatedBoard?.currentBlockadeStage === null) {
            log("  ✅ Verificación de desbloqueo exitosa");
          } else {
            log("  ⚠️ Verificación de desbloqueo falló - Estado actual:" + JSON.stringify({
              boardState: updatedBoard?.idBoardState,
              blockadeStage: updatedBoard?.currentBlockadeStage
            }));
          }
        } catch (error) {
          log("  ❌ Error al desbloquear el tablero: " + JSON.stringify(error));
        }
      } else {
        log("  ℹ️ No hay suficientes usuarios hijos verificados para desbloquear");
      }
    }
    
    log("\n=== PROCESO COMPLETADO ===");
    
  } catch (error) {
    log("Error durante el proceso: " + JSON.stringify(error));
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      log("\nConexión a base de datos cerrada");
    }
  }

  // Leer y mostrar el contenido del log
  log("\nContenido del archivo de log:");
  const logContent = fs.readFileSync(logFile, 'utf8');
  console.log(logContent);
}

// Ejecutar el script
fixGenesisThirdBlockadeUnlock()
  .then(() => console.log("Script finalizado"))
  .catch(error => console.error("Error durante la ejecución:", error)); 
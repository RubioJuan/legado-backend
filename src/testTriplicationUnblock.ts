import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { resolveGenesisThirdBlockade } from "./services/user.service";

/**
 * Script para probar el desbloqueo de triplicación después de las correcciones
 */
async function testTriplicationUnblock() {
  console.log("=== PRUEBA DE DESBLOQUEO DE TRIPLICACIÓN ===");
  
  try {
    // Inicializar conexión
    await AppDataSource.initialize();
    console.log("Conexión a base de datos establecida");
    
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // 1. Buscar el tablero 498
    const board = await queryRunner.manager.findOne(Board, {
      where: { id: 498 }
    });
    
    if (!board) {
      console.error("Tablero 498 no encontrado!");
      return;
    }
    
    console.log(`Tablero 498 encontrado con estado: ${board.idBoardState}, etapa de bloqueo: ${board.currentBlockadeStage || 'Sin bloqueo'}`);
    
    if (!board.idGoalScorer) {
      console.error("El tablero no tiene un General (idGoalScorer)!");
      return;
    }
    
    // 2. Buscar todos los usuarios hijos para triplicación
    const childUsers = await queryRunner.manager.find(EntityUser, {
      where: { triplicationOfId: board.idGoalScorer }
    });
    
    console.log(`Se encontraron ${childUsers.length} usuarios hijos para triplicación`);
    
    if (childUsers.length === 0) {
      console.log("No hay usuarios hijos. Creando usuarios de prueba para triplicación...");
      
      // Crear 3 usuarios hijos de prueba
      for (let i = 0; i < 3; i++) {
        const childUser = queryRunner.manager.create(EntityUser, {
          username: `triplication_test_${i}_${Date.now()}`,
          password: "password_hash", // En un caso real esto debería estar hasheado
          firstName: "Test",
          lastName: `Child ${i}`,
          country: "TestCountry",
          countryCode: "+00",
          phoneNumber: `00000000${i}`,
          idRole: 2, // PLAYER
          idUserState: 1, // ACTIVE
          idUserProcessState: i < 2 ? 3 : 2, // Primeros 2 en estado VALIDATING (3), el tercero en PROCESS (2)
          triplicationOfId: board.idGoalScorer
        });
        
        await queryRunner.manager.save(childUser);
        console.log(`Usuario hijo #${i+1} creado con ID ${childUser.id}`);
      }
      
      // Refrescar la lista de usuarios hijos
      const newChildUsers = await queryRunner.manager.find(EntityUser, {
        where: { triplicationOfId: board.idGoalScorer }
      });
      
      console.log(`Ahora hay ${newChildUsers.length} usuarios hijos para triplicación`);
    }
    
    // 3. Configurar el tablero en etapa 3 de bloqueo para la prueba
    if (board.currentBlockadeStage !== 3) {
      await queryRunner.manager.update(Board, board.id, {
        currentBlockadeStage: 3,
        idBoardState: 3, // BLOCKED
        isAwaitingUserCreation: false // Probar que funcione sin esta bandera
      });
      
      console.log("Tablero configurado en etapa 3 de bloqueo para pruebas");
    }
    
    // 4. Probar la función de desbloqueo de etapa 3
    console.log("\n=== PROBANDO DESBLOQUEO DE ETAPA 3 ===");
    const resultEtapa3 = await resolveGenesisThirdBlockade(board.idGoalScorer, queryRunner);
    
    console.log(`Resultado: ${resultEtapa3.message}`);
    console.log(`Estado: ${resultEtapa3.status}`);
    
    // 5. Verificar si se desbloqueó correctamente
    const boardAfterTest = await queryRunner.manager.findOne(Board, {
      where: { id: 498 }
    });
    
    if (boardAfterTest) {
      console.log(`\nEstado del tablero después de la prueba:`);
      console.log(`Estado: ${boardAfterTest.idBoardState}`);
      console.log(`Etapa de bloqueo: ${boardAfterTest.currentBlockadeStage || 'Sin bloqueo'}`);
      
      if (boardAfterTest.currentBlockadeStage === null && boardAfterTest.idBoardState === 1) {
        console.log("✅ ÉXITO: El tablero se desbloqueó correctamente!");
      } else {
        console.log("❌ ERROR: El tablero no se desbloqueó correctamente.");
      }
    }
    
  } catch (error) {
    console.error("Error durante la prueba:", error);
  } finally {
    // Cerrar conexión
    await AppDataSource.destroy();
    console.log("\nConexión a base de datos cerrada");
  }
}

// Ejecutar la función
testTriplicationUnblock()
  .then(() => console.log("Prueba completada"))
  .catch(error => console.error("Error durante la prueba:", error)); 
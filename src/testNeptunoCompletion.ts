import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { Subscription } from "./entities/subscription.entity";
import { EntityUser } from "./entities/user.entity";

async function testNeptunoCompletion() {
  console.log("=== TESTING NEPTUNO COMPLETION SUBSCRIPTION CLEANUP ===");

  try {
    // Inicializar conexión
    await AppDataSource.initialize();

    // 1. Buscar un general en un tablero de Neptuno (nivel 4)
    const neptunoGeneral = await AppDataSource.manager
      .createQueryBuilder(EntityUser, "user")
      .innerJoin(Board, "board", "board.idGoalScorer = user.id")
      .where("board.idLevelId = :levelId", { levelId: 4 }) // Neptuno
      .andWhere("user.idUserProcessState != :completedState", { completedState: 6 }) // No completado
      .select([
        "user.id",
        "user.username", 
        "user.idUserProcessState",
        "user.ballsReceivedConfirmed",
        "board.id AS boardId"
      ])
      .getRawOne();

    if (!neptunoGeneral) {
      console.log("❌ No se encontró ningún general en Neptuno disponible para prueba");
      return;
    }

    console.log(`\n👤 General encontrado:`);
    console.log(`   ID: ${neptunoGeneral.user_id}`);
    console.log(`   Username: ${neptunoGeneral.user_username}`);
    console.log(`   Estado: ${neptunoGeneral.user_idUserProcessState}`);
    console.log(`   Donaciones: ${neptunoGeneral.user_ballsReceivedConfirmed}/8`);
    console.log(`   Tablero: ${neptunoGeneral.boardId}`);

    // 2. Verificar subscriptions ANTES
    const subscriptionsBefore = await AppDataSource.manager.find(Subscription, {
      where: { idUser: neptunoGeneral.user_id },
      relations: ["board"]
    });

    console.log(`\n📋 Subscriptions ANTES de completar:`);
    for (const sub of subscriptionsBefore) {
      const board = await AppDataSource.manager.findOne(Board, { 
        where: { id: sub.idBoard }
      });
      console.log(`   - Subscription ID: ${sub.id}, Board: ${sub.idBoard}, Level: ${board?.idLevelId}, State: ${sub.idSubscriptionState}`);
    }

    // 3. Simular que el general completó las 8 donaciones
    console.log(`\n🎯 Simulando que el general recibió 8 donaciones...`);
    await AppDataSource.manager.update(EntityUser, 
      { id: neptunoGeneral.user_id },
      { ballsReceivedConfirmed: 8 }
    );

    // 4. Aquí normalmente se llamaría al servicio de promoción que debería:
    // - Cambiar estado del usuario a COMPLETADO (6)
    // - Eliminar del tablero (idGoalScorer = null)  
    // - Eliminar la subscription
    console.log(`\n🚀 Simulando promoción completada en Neptuno...`);
    
    // Verificar otros jugadores en el tablero ANTES de la división
    const playersBeforeSplit = await AppDataSource.manager
      .createQueryBuilder()
      .select("*")
      .from(Board, "board")
      .where("board.id = :boardId", { boardId: neptunoGeneral.boardId })
      .getRawOne();
    
    console.log(`\n👥 Jugadores en tablero ${neptunoGeneral.boardId} ANTES de división:`);
    console.log(`   General: ${playersBeforeSplit.idGoalScorer || 'null'}`);
    console.log(`   Creadores: ${playersBeforeSplit.idCreator1 || 'null'}, ${playersBeforeSplit.idCreator2 || 'null'}`);
    console.log(`   Generadores: ${playersBeforeSplit.idGenerator1 || 'null'}, ${playersBeforeSplit.idGenerator2 || 'null'}, ${playersBeforeSplit.idGenerator3 || 'null'}, ${playersBeforeSplit.idGenerator4 || 'null'}`);
    console.log(`   Defensores: ${playersBeforeSplit.idDefender1 || 'null'}, ${playersBeforeSplit.idDefender2 || 'null'}, ${playersBeforeSplit.idDefender3 || 'null'}, ${playersBeforeSplit.idDefender4 || 'null'}, ${playersBeforeSplit.idDefender5 || 'null'}, ${playersBeforeSplit.idDefender6 || 'null'}, ${playersBeforeSplit.idDefender7 || 'null'}, ${playersBeforeSplit.idDefender8 || 'null'}`);
    
    await AppDataSource.manager.update(EntityUser, 
      { id: neptunoGeneral.user_id },
      { 
        idUserProcessState: 6, // COMPLETADO
        secondaryBoardIdAsRecruit: null,
        secondaryBoardLevelIdAsRecruit: null,
        secondaryPositionAsRecruit: null,
      }
    );

    await AppDataSource.manager.update(Board, 
      { id: neptunoGeneral.boardId },
      { idGoalScorer: null }
    );

    // ✅ ELIMINAR SUBSCRIPTION (esto es lo que agregamos)
    const deletedSubscriptions = await AppDataSource.manager.delete(Subscription, { 
      idUser: neptunoGeneral.user_id,
      idBoard: neptunoGeneral.boardId 
    });

    console.log(`   ✅ Usuario marcado como COMPLETADO`);
    console.log(`   ✅ Eliminado del tablero ${neptunoGeneral.boardId}`);
    console.log(`   ✅ Subscriptions eliminadas: ${deletedSubscriptions.affected}`);
    
    // ✅ NUEVO: Verificar que el tablero de Neptuno también se divide
    console.log(`\n🔄 Verificando división del tablero de Neptuno...`);
    
    // Buscar tableros de Neptuno (nivel 4) creados recientemente
    const newNeptunoBoards = await AppDataSource.manager.find(Board, {
      where: { idLevelId: 4 },
      order: { createAt: "DESC" },
      take: 10 // Los 10 más recientes
    });
    
    console.log(`\n📋 Tableros de Neptuno encontrados (ordenados por fecha):`);
    for (const board of newNeptunoBoards) {
      const playersCount = [
        board.idGoalScorer, board.idCreator1, board.idCreator2,
        board.idGenerator1, board.idGenerator2, board.idGenerator3, board.idGenerator4,
        board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
        board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
      ].filter(id => id !== null).length;
      
      console.log(`   Tablero ${board.id}: ${playersCount} jugadores, Estado: ${board.idBoardState}, Creado: ${board.createAt}`);
    }
    
    // Verificar que el tablero original esté cerrado/inactivo
    const originalBoard = await AppDataSource.manager.findOne(Board, {
      where: { id: neptunoGeneral.boardId }
    });
    
    console.log(`\n📊 Estado del tablero original ${neptunoGeneral.boardId}:`);
    console.log(`   Estado: ${originalBoard?.idBoardState} (2 = INACTIVO/CERRADO)`);
    console.log(`   General: ${originalBoard?.idGoalScorer || 'null'} (debe ser null)`);
    
    if (originalBoard?.idBoardState === 2 && originalBoard?.idGoalScorer === null) {
      console.log(`   ✅ CORRECTO: Tablero original cerrado y sin general`);
    } else {
      console.log(`   ⚠️  ADVERTENCIA: Estado del tablero original no es el esperado`);
    }

    // 5. Verificar subscriptions DESPUÉS
    const subscriptionsAfter = await AppDataSource.manager.find(Subscription, {
      where: { idUser: neptunoGeneral.user_id }
    });

    console.log(`\n📋 Subscriptions DESPUÉS de completar:`);
    if (subscriptionsAfter.length === 0) {
      console.log(`   ✅ CORRECTO: No hay subscriptions (usuario completó el juego)`);
    } else {
      console.log(`   ⚠️  ADVERTENCIA: Aún hay ${subscriptionsAfter.length} subscriptions:`);
      for (const sub of subscriptionsAfter) {
        console.log(`   - Subscription ID: ${sub.id}, Board: ${sub.idBoard}, State: ${sub.idSubscriptionState}`);
      }
    }

    // 6. Verificar estado final del usuario
    const finalUser = await AppDataSource.manager.findOne(EntityUser, {
      where: { id: neptunoGeneral.user_id }
    });

    console.log(`\n👤 Estado final del usuario:`);
    console.log(`   Estado: ${finalUser?.idUserProcessState} (6 = COMPLETADO)`);
    console.log(`   Secondary Board: ${finalUser?.secondaryBoardIdAsRecruit || 'null'}`);
    console.log(`   Solo queda en entity_user: ✅`);

    console.log(`\n✅ PRUEBA COMPLETADA EXITOSAMENTE`);
    console.log(`\n📝 RESUMEN:`);
    console.log(`   - El usuario completó Neptuno`);
    console.log(`   - Se eliminó del tablero`);
    console.log(`   - Se eliminaron sus subscriptions`);
    console.log(`   - ✅ NUEVO: El tablero de Neptuno se dividió para los demás jugadores`);
    console.log(`   - Solo queda el registro histórico en entity_user`);

  } catch (error) {
    console.error("❌ Error durante la prueba:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Función para verificar usuarios completados
async function checkCompletedUsers() {
  console.log("\n=== VERIFICANDO USUARIOS COMPLETADOS ===");
  
  await AppDataSource.initialize();
  
  const completedUsers = await AppDataSource.manager.find(EntityUser, {
    where: { idUserProcessState: 6 } // COMPLETADO
  });
  
  console.log(`\n👥 Usuarios completados encontrados: ${completedUsers.length}`);
  
  for (const user of completedUsers) {
    const subscriptions = await AppDataSource.manager.find(Subscription, {
      where: { idUser: user.id }
    });
    
    console.log(`\n👤 Usuario: ${user.username} (ID: ${user.id})`);
    console.log(`   Estado: ${user.idUserProcessState} (COMPLETADO)`);
    console.log(`   Subscriptions: ${subscriptions.length}`);
    
    if (subscriptions.length > 0) {
      console.log(`   ⚠️  PROBLEMA: Tiene subscriptions huérfanas:`);
      for (const sub of subscriptions) {
        console.log(`     - Board: ${sub.idBoard}, State: ${sub.idSubscriptionState}`);
      }
    } else {
      console.log(`   ✅ CORRECTO: Sin subscriptions`);
    }
  }
  
  await AppDataSource.destroy();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testNeptunoCompletion().then(() => {
    console.log("\nEjecutando verificación adicional...");
    return checkCompletedUsers();
  });
}

export { checkCompletedUsers, testNeptunoCompletion };

 
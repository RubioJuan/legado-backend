import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function insertCompleteBasicData() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // 1. SUBSCRIPTION_STATE
    console.log("\n📋 1. Verificando subscription_state...");
    const subscriptionStates = [
      { id: 1, name: 'ACTIVE' },
      { id: 2, name: 'CLOSED' },
      { id: 3, name: 'BLOCKED' }
    ];
    
    for (const state of subscriptionStates) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO subscription_state (id, name) VALUES (?, ?)
        `, [state.id, state.name]);
        console.log(`✅ subscription_state: ${state.id} - ${state.name}`);
      } catch (error) {
        console.log(`⚠️  subscription_state ${state.name}: ${(error as Error).message}`);
      }
    }
    
    // 2. LEVEL
    console.log("\n📋 2. Verificando level...");
    const levels = [
      { id: 1, name: 'Génesis' },
      { id: 2, name: 'Armagedón' },
      { id: 3, name: 'Apolo' },
      { id: 4, name: 'Neptuno' }
    ];
    
    for (const level of levels) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO level (id, name) VALUES (?, ?)
        `, [level.id, level.name]);
        console.log(`✅ level: ${level.id} - ${level.name}`);
      } catch (error) {
        console.log(`⚠️  level ${level.name}: ${(error as Error).message}`);
      }
    }
    
    // 3. ROLE
    console.log("\n📋 3. Verificando role...");
    const roles = [
      { id: 1, name: 'ADMINISTRATOR' },
      { id: 2, name: 'PLAYER' }
    ];
    
    for (const role of roles) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO role (id, name) VALUES (?, ?)
        `, [role.id, role.name]);
        console.log(`✅ role: ${role.id} - ${role.name}`);
      } catch (error) {
        console.log(`⚠️  role ${role.name}: ${(error as Error).message}`);
      }
    }
    
    // 4. USER_STATE
    console.log("\n📋 4. Verificando user_state...");
    const userStates = [
      { id: 1, name: 'ACTIVE' },
      { id: 2, name: 'BLOCKED' }
    ];
    
    for (const state of userStates) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO user_state (id, name) VALUES (?, ?)
        `, [state.id, state.name]);
        console.log(`✅ user_state: ${state.id} - ${state.name}`);
      } catch (error) {
        console.log(`⚠️  user_state ${state.name}: ${(error as Error).message}`);
      }
    }
    
    // 5. USER_PROCESS_STATE
    console.log("\n📋 5. Verificando user_process_state...");
    const userProcessStates = [
      { id: 1, name: 'WAITING' },
      { id: 2, name: 'PROCESS' },
      { id: 3, name: 'VALIDATING' },
      { id: 4, name: 'VALIDATED' },
      { id: 5, name: 'BLOCKED' },
      { id: 6, name: 'COMPLETADO' },
      { id: 7, name: 'EN_COLA' }
    ];
    
    for (const state of userProcessStates) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO user_process_state (id, name) VALUES (?, ?)
        `, [state.id, state.name]);
        console.log(`✅ user_process_state: ${state.id} - ${state.name}`);
      } catch (error) {
        console.log(`⚠️  user_process_state ${state.name}: ${(error as Error).message}`);
      }
    }
    
    // 6. BOARD_STATE
    console.log("\n📋 6. Verificando board_state...");
    const boardStates = [
      { id: 1, name: 'Activo' },
      { id: 2, name: 'Inactivo' },
      { id: 3, name: 'Bloqueado' }
    ];
    
    for (const state of boardStates) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO board_state (id, name) VALUES (?, ?)
        `, [state.id, state.name]);
        console.log(`✅ board_state: ${state.id} - ${state.name}`);
      } catch (error) {
        console.log(`⚠️  board_state ${state.name}: ${(error as Error).message}`);
      }
    }
    
    // 7. BOARD - LOS 4 TABLEROS BÁSICOS
    console.log("\n📋 7. Verificando tableros básicos...");
    const boards = [
      { id: 1, levelId: 1, levelName: 'Génesis' },
      { id: 3, levelId: 2, levelName: 'Armagedón' },
      { id: 4, levelId: 3, levelName: 'Apolo' },
      { id: 5, levelId: 4, levelName: 'Neptuno' }
    ];
    
    for (const board of boards) {
      try {
        await AppDataSource.query(`
          INSERT IGNORE INTO board (
            id, 
            idLevelId, 
            idBoardState, 
            isAwaitingUserCreation,
            createAt,
            updateAt
          ) VALUES (?, ?, 1, 0, NOW(), NOW())
        `, [board.id, board.levelId]);
        console.log(`✅ board: ID ${board.id} - ${board.levelName} (Nivel ${board.levelId})`);
      } catch (error) {
        console.log(`⚠️  board ${board.id}: ${(error as Error).message}`);
      }
    }
    
    // VERIFICACIÓN FINAL
    console.log("\n🔍 VERIFICACIÓN FINAL:");
    
    const finalBoards = await AppDataSource.query(`
      SELECT 
        b.id,
        b.idLevelId,
        l.name as levelName,
        b.idBoardState,
        bs.name as boardStateName,
        b.isAwaitingUserCreation
      FROM board b
      LEFT JOIN level l ON b.idLevelId = l.id
      LEFT JOIN board_state bs ON b.idBoardState = bs.id
      ORDER BY b.id
    `);
    
    console.log("\n📊 TABLEROS FINALES:");
    finalBoards.forEach((board: any) => {
      console.log(`   ID: ${board.id} | ${board.levelName} (Nivel ${board.idLevelId}) | Estado: ${board.boardStateName} | Waiting: ${board.isAwaitingUserCreation}`);
    });
    
    await AppDataSource.destroy();
    console.log("\n🎉 ¡Todos los datos básicos están configurados correctamente!");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

insertCompleteBasicData(); 
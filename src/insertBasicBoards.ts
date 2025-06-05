import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function insertBasicBoards() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // Verificar que existan los niveles y estados necesarios
    console.log("📋 Verificando niveles...");
    const levels = await AppDataSource.query(`SELECT id, name FROM level ORDER BY id`);
    console.log("Niveles disponibles:", levels);
    
    console.log("📋 Verificando estados de tablero...");
    const boardStates = await AppDataSource.query(`SELECT id, name FROM board_state ORDER BY id`);
    console.log("Estados disponibles:", boardStates);
    
    // Insertar los 4 tableros básicos
    const boards = [
      {
        id: 1,
        idLevelId: 1,
        idBoardState: 1,
        isAwaitingUserCreation: 0
      },
      {
        id: 3,
        idLevelId: 2,
        idBoardState: 1,
        isAwaitingUserCreation: 0
      },
      {
        id: 4,
        idLevelId: 3,
        idBoardState: 1,
        isAwaitingUserCreation: 0
      },
      {
        id: 5,
        idLevelId: 4,
        idBoardState: 1,
        isAwaitingUserCreation: 0
      }
    ];
    
    console.log("\n🏗️ Insertando tableros básicos...");
    
    for (const board of boards) {
      try {
        await AppDataSource.query(`
          INSERT INTO board (
            id,
            idLevelId,
            idBoardState,
            isAwaitingUserCreation,
            createAt,
            updateAt
          ) VALUES (?, ?, ?, ?, NOW(), NOW())
        `, [
          board.id,
          board.idLevelId,
          board.idBoardState,
          board.isAwaitingUserCreation
        ]);
        
        console.log(`✅ Tablero ${board.id} creado (Nivel ${board.idLevelId})`);
      } catch (error) {
        console.log(`⚠️  Error con tablero ${board.id}: ${(error as Error).message}`);
      }
    }
    
    // Verificar tableros creados
    console.log("\n📊 Verificando tableros creados...");
    const createdBoards = await AppDataSource.query(`
      SELECT 
        b.id,
        b.idLevelId,
        l.name as levelName,
        b.idBoardState,
        bs.name as boardStateName,
        b.createAt,
        b.updateAt
      FROM board b
      LEFT JOIN level l ON b.idLevelId = l.id
      LEFT JOIN board_state bs ON b.idBoardState = bs.id
      ORDER BY b.id
    `);
    
    console.log("\nTableros creados:");
    createdBoards.forEach((board: any) => {
      console.log(`   ID: ${board.id} | Nivel: ${board.idLevelId} (${board.levelName}) | Estado: ${board.idBoardState} (${board.boardStateName})`);
    });
    
    await AppDataSource.destroy();
    console.log("\n✅ ¡Tableros básicos creados exitosamente!");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

insertBasicBoards(); 
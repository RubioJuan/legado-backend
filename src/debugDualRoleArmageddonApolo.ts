import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { Level } from "./entities/level.entity";
import { EntityUser } from "./entities/user.entity";

async function debugDualRoleArmageddonApolo() {
  console.log("=== DIAGNÓSTICO DEL ROL DUAL ARMAGEDÓN → APOLO ===");
  
  try {
    await AppDataSource.initialize();
    
    // 1. Verificar tableros activos en Armagedón (nivel 2)
    console.log("\n--- TABLEROS ACTIVOS EN ARMAGEDÓN (Nivel 2) ---");
    const armageddonBoards = await AppDataSource.manager.find(Board, {
      where: { idLevelId: 2, idBoardState: 2 }, // Estado 2 = ACTIVE
      order: { id: "ASC" }
    });
    
    console.log(`Tableros activos en Armagedón: ${armageddonBoards.length}`);
    
    for (const board of armageddonBoards) {
      console.log(`Tablero ${board.id}:`);
      console.log(`  - General (idGoalScorer): ${board.idGoalScorer}`);
      console.log(`  - Estado: ${board.idBoardState}`);
      
      if (board.idGoalScorer) {
        const general = await AppDataSource.manager.findOne(EntityUser, {
          where: { id: board.idGoalScorer }
        });
        
        if (general) {
          console.log(`  - General username: ${general.username}`);
          console.log(`  - Es admin: ${general.idRole === 1 ? 'SÍ' : 'NO'}`);
          console.log(`  - Tiene rol dual: ${general.secondaryBoardIdAsRecruit ? 'SÍ' : 'NO'}`);
          
          if (general.secondaryBoardIdAsRecruit) {
            console.log(`    * Tablero secundario: ${general.secondaryBoardIdAsRecruit}`);
            console.log(`    * Nivel secundario: ${general.secondaryBoardLevelIdAsRecruit}`);
            console.log(`    * Posición secundaria: ${general.secondaryPositionAsRecruit}`);
          }
        }
      }
      console.log("");
    }
    
    // 2. Verificar tableros disponibles en Apolo (nivel 3)
    console.log("\n--- TABLEROS EN APOLO (Nivel 3) ---");
    const apoloBoards = await AppDataSource.manager.find(Board, {
      where: { idLevelId: 3 },
      order: { id: "ASC" }
    });
    
    console.log(`Total tableros en Apolo: ${apoloBoards.length}`);
    
    const activApoloBoards = apoloBoards.filter(b => b.idBoardState === 2);
    const waitingApoloBoards = apoloBoards.filter(b => b.idBoardState === 1);
    
    console.log(`- Tableros ACTIVOS en Apolo: ${activApoloBoards.length}`);
    console.log(`- Tableros ESPERANDO en Apolo: ${waitingApoloBoards.length}`);
    
    // 3. Analizar slots disponibles en tableros activos de Apolo
    console.log("\n--- ANÁLISIS DE SLOTS DISPONIBLES EN APOLO ---");
    
    for (const board of activApoloBoards) {
      console.log(`\nTablero Apolo ${board.id}:`);
      
      const defenderSlots = [
        { name: 'idDefender1', value: board.idDefender1 },
        { name: 'idDefender2', value: board.idDefender2 },
        { name: 'idDefender3', value: board.idDefender3 },
        { name: 'idDefender4', value: board.idDefender4 },
        { name: 'idDefender5', value: board.idDefender5 },
        { name: 'idDefender6', value: board.idDefender6 },
        { name: 'idDefender7', value: board.idDefender7 },
        { name: 'idDefender8', value: board.idDefender8 }
      ];
      
      const availableDefenderSlots = defenderSlots.filter(slot => slot.value === null);
      const occupiedDefenderSlots = defenderSlots.filter(slot => slot.value !== null);
      
      console.log(`  - Slots de RECLUTA disponibles: ${availableDefenderSlots.length}`);
      console.log(`  - Slots de RECLUTA ocupados: ${occupiedDefenderSlots.length}`);
      
      if (availableDefenderSlots.length > 0) {
        console.log(`  - Posiciones disponibles: ${availableDefenderSlots.map(s => s.name).join(', ')}`);
      }
      
      // También verificar posiciones de mayor rango
      const higherRankSlots = [
        { name: 'idGoalScorer', value: board.idGoalScorer },
        { name: 'idCreator1', value: board.idCreator1 },
        { name: 'idCreator2', value: board.idCreator2 },
        { name: 'idGenerator1', value: board.idGenerator1 },
        { name: 'idGenerator2', value: board.idGenerator2 },
        { name: 'idGenerator3', value: board.idGenerator3 },
        { name: 'idGenerator4', value: board.idGenerator4 }
      ];
      
      const availableHigherSlots = higherRankSlots.filter(slot => slot.value === null);
      if (availableHigherSlots.length > 0) {
        console.log(`  - Posiciones SUPERIORES disponibles: ${availableHigherSlots.map(s => s.name).join(', ')}`);
      }
    }
    
    // 4. Verificar usuarios en cola de espera
    console.log("\n--- USUARIOS EN COLA DE ESPERA ---");
    
    try {
      const waitingGenerals = await AppDataSource.manager.query(
        'SELECT * FROM general_awaiting_recruit_slot WHERE targetRecruitLevelId = 3 ORDER BY createdAt ASC'
      );
      
      console.log(`Generales esperando slot en Apolo: ${waitingGenerals.length}`);
      
      for (const waiting of waitingGenerals) {
        console.log(`- Usuario ${waiting.userId}: Razón: ${waiting.reasonForWaiting}, Creado: ${waiting.createdAt}`);
      }
    } catch (e) {
      console.log("No se pudo verificar la cola de espera (tabla puede no existir)");
    }
    
    // 5. Simular el cálculo que hace setupPotentialDualRoleForGeneralService
    console.log("\n--- SIMULACIÓN DEL CÁLCULO DE NIVEL OBJETIVO ---");
    
    const armageddonLevelId = 2;
    const targetAppoloLevelId = armageddonLevelId + 1; // = 3
    
    console.log(`Nivel primario (Armagedón): ${armageddonLevelId}`);
    console.log(`Nivel objetivo calculado (Apolo): ${targetAppoloLevelId}`);
    
    // Verificar que el nivel objetivo existe
    const apoloLevel = await AppDataSource.manager.findOne(Level, { where: { id: 3 } });
    console.log(`Nivel Apolo existe en BD: ${apoloLevel ? 'SÍ' : 'NO'}`);
    if (apoloLevel) {
      console.log(`Nombre del nivel: ${apoloLevel.name}`);
    }
    
    console.log("\n=== FIN DEL DIAGNÓSTICO ===");
    
  } catch (error) {
    console.error("Error en el diagnóstico:", error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Ejecutar el diagnóstico
debugDualRoleArmageddonApolo().catch(console.error); 
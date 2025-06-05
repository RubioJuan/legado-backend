import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function checkTables() {
  try {
    console.log("🔍 Verificando tablas en la base de datos...");
    
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // Consultar qué tablas existen
    const tables = await AppDataSource.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${AppDataSource.options.database}'
    `);
    
    console.log(`\n📊 Tablas encontradas (${tables.length}):`);
    
    if (tables.length === 0) {
      console.log("❌ NO HAY TABLAS - Las tablas no se crearon con synchronize: true");
    } else {
      tables.forEach((table: any, index: number) => {
        console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
      });
      
      // Verificar si están las tablas principales que necesitamos
      const tableNames = tables.map((t: any) => t.TABLE_NAME);
      const requiredTables = ['board_state', 'entity_user', 'board', 'subscription'];
      
      console.log("\n🎯 Verificando tablas principales:");
      requiredTables.forEach(tableName => {
        const exists = tableNames.includes(tableName);
        console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
      });
    }
    
    await AppDataSource.destroy();
    console.log("\n✅ Conexión cerrada");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

checkTables(); 
import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function testSynchronize() {
  try {
    console.log("🔍 Testing synchronize: true...");
    
    // Mostrar configuración
    console.log("📊 Entidades cargadas:", AppDataSource.options.entities?.length);
    console.log("🔧 Synchronize:", AppDataSource.options.synchronize);
    
    console.log("\n⏳ Inicializando DataSource con synchronize: true...");
    
    // Solo inicializar, sin ejecutar otras funciones
    await AppDataSource.initialize();
    
    console.log("✅ DataSource inicializado!");
    console.log("⏳ Verificando si se crearon tablas...");
    
    // Verificar tablas inmediatamente después de la inicialización
    const tables = await AppDataSource.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'legado_db'
    `);
    
    console.log(`\n📊 Tablas después de synchronize (${tables.length}):`);
    tables.forEach((table: any, index: number) => {
      console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
    });
    
    if (tables.length <= 1) {
      console.log("\n❌ SYNCHRONIZE NO FUNCIONÓ - Solo existe tabla migrations");
      
      // Verificar si hay errores en los metadatos
      console.log("\n🔍 Verificando metadatos de entidades:");
      const entityMetadatas = AppDataSource.entityMetadatas;
      console.log(`   Entidades encontradas: ${entityMetadatas.length}`);
      
      entityMetadatas.forEach(meta => {
        console.log(`   - ${meta.name} → ${meta.tableName}`);
      });
      
    } else {
      console.log("\n✅ SYNCHRONIZE FUNCIONÓ!");
    }
    
    await AppDataSource.destroy();
    console.log("\n✅ Test completado");
    
  } catch (error) {
    console.error("❌ Error en test:", (error as Error).message);
    console.error("Stack:", (error as Error).stack);
  }
}

testSynchronize(); 
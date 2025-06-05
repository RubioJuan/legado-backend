import * as fs from "fs";
import * as path from "path";
import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function markMigrationsAsExecuted() {
  try {
    console.log("🔧 Marcando migraciones como ejecutadas...");
    
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // Leer todos los archivos de migración
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort(); // Ordenar por nombre (que incluye timestamp)
    
    console.log(`📝 Encontradas ${migrationFiles.length} migraciones`);
    
    // Verificar si ya hay migraciones registradas
    const existingMigrations = await AppDataSource.query(`
      SELECT name FROM migrations ORDER BY id
    `);
    
    console.log(`📊 Migraciones ya registradas: ${existingMigrations.length}`);
    
    if (existingMigrations.length > 0) {
      console.log("   Migraciones existentes:");
      existingMigrations.forEach((mig: any, index: number) => {
        console.log(`   ${index + 1}. ${mig.name}`);
      });
    }
    
    // Insertar cada migración como ejecutada
    let insertedCount = 0;
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.ts', '');
      
      // Verificar si ya existe
      const exists = existingMigrations.some((m: any) => m.name === migrationName);
      
      if (!exists) {
        await AppDataSource.query(`
          INSERT INTO migrations (timestamp, name) 
          VALUES (?, ?)
        `, [Date.now(), migrationName]);
        
        console.log(`✅ Marcada como ejecutada: ${migrationName}`);
        insertedCount++;
      } else {
        console.log(`⏭️  Ya existe: ${migrationName}`);
      }
    }
    
    console.log(`\n✅ Proceso completado: ${insertedCount} migraciones nuevas marcadas como ejecutadas`);
    
    // Verificar estado final
    const finalMigrations = await AppDataSource.query(`
      SELECT name FROM migrations ORDER BY id
    `);
    
    console.log(`\n📊 Total de migraciones registradas: ${finalMigrations.length}`);
    
    await AppDataSource.destroy();
    console.log("\n✅ ¡Listo! Ahora las migraciones no se ejecutarán de nuevo");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

markMigrationsAsExecuted(); 
import * as fs from "fs";
import * as path from "path";
import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function markMigrationsCorrect() {
  try {
    console.log("🔧 Marcando migraciones con estructura correcta...");
    
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // Leer todos los archivos de migración
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.ts'))
      .sort(); // Ordenar por nombre (que incluye timestamp)
    
    console.log(`📝 Encontradas ${migrationFiles.length} migraciones`);
    
    // Verificar estructura de tabla migrations
    const structure = await AppDataSource.query(`DESCRIBE migrations`);
    console.log("📊 Estructura tabla migrations:", structure.map((col: any) => col.Field));
    
    // Insertar cada migración usando solo timestamp
    let insertedCount = 0;
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.ts', '');
      
      // Extraer timestamp del nombre del archivo
      let timestamp;
      if (migrationName.match(/^\d{13}/)) {
        // Si el nombre empieza con 13 dígitos (timestamp)
        timestamp = parseInt(migrationName.substring(0, 13));
      } else {
        // Para archivos sin timestamp numérico, usar un timestamp falso
        timestamp = Date.now() - (migrationFiles.length - migrationFiles.indexOf(file)) * 1000;
      }
      
      try {
        await AppDataSource.query(`
          INSERT INTO migrations (timestamp) 
          VALUES (?)
        `, [timestamp]);
        
        console.log(`✅ Marcada: ${migrationName} (timestamp: ${timestamp})`);
        insertedCount++;
      } catch (error) {
        console.log(`⚠️  Error con ${migrationName}: ${(error as Error).message}`);
      }
    }
    
    console.log(`\n✅ Proceso completado: ${insertedCount} migraciones marcadas`);
    
    // Verificar estado final
    const finalMigrations = await AppDataSource.query(`
      SELECT * FROM migrations ORDER BY id
    `);
    
    console.log(`\n📊 Total registros en migrations: ${finalMigrations.length}`);
    
    await AppDataSource.destroy();
    console.log("\n✅ ¡Listo! Ahora intenta npm run m:run");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

markMigrationsCorrect(); 
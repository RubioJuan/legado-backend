import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function testEntitiesLoading() {
  try {
    console.log("🔍 Verificando configuración de entidades...");
    
    // Mostrar configuración actual
    console.log("📁 Path de entidades:", AppDataSource.options.entities);
    console.log("🔧 Synchronize:", AppDataSource.options.synchronize);
    console.log("🗄️ Database:", AppDataSource.options.database);
    
    // Intentar inicializar SIN conectar a la base de datos
    console.log("\n⏳ Intentando cargar metadatos de entidades...");
    
    // Solo mostrar si puede cargar las entidades (sin conectar a DB)
    const entityMetadatas = AppDataSource.entityMetadatas;
    console.log("📊 Entidades encontradas:", entityMetadatas.length);
    
    if (entityMetadatas.length === 0) {
      console.log("❌ NO se encontraron entidades - ESTE ES EL PROBLEMA");
      console.log("🔍 Revisando path de entidades:");
      console.log("   Current working directory:", process.cwd());
      console.log("   __dirname:", __dirname);
    } else {
      console.log("✅ Entidades cargadas correctamente:");
      entityMetadatas.forEach(meta => {
        console.log(`   - ${meta.name} (tabla: ${meta.tableName})`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

testEntitiesLoading(); 
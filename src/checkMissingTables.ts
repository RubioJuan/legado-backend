import { AppDataSource } from "./config/db";

const checkMissingTables = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection successful");

    const queryRunner = AppDataSource.createQueryRunner();
    
    // Get all tables in the database
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'legado_db'
    `);
    
    console.log("\n📋 Existing tables:");
    const existingTableNames = tables.map((table: any) => table.TABLE_NAME || table.table_name);
    existingTableNames.sort().forEach((tableName: string) => {
      console.log(`  - ${tableName}`);
    });
    
    // Expected tables based on entities
    const expectedTables = [
      'entity_user',
      'subscription_state',
      'role',
      'board_state',
      'user_state',
      'general_awaiting_recruit_slot',
      'board',
      'tail',
      'subscription',
      'associations',
      'password_reset_tokens',
      'audit',
      'user_process_state',
      'level',
      'migrations'
    ];
    
    console.log("\n🎯 Expected tables:");
    expectedTables.sort().forEach(table => {
      console.log(`  - ${table}`);
    });
    
    const missingTables = expectedTables.filter(table => !existingTableNames.includes(table));
    
    console.log("\n❌ Missing tables:");
    if (missingTables.length === 0) {
      console.log("  None! All tables exist.");
    } else {
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    // Check for table name mismatches
    console.log("\n🔍 Checking for similar names:");
    missingTables.forEach(missing => {
      const similar = existingTableNames.find((existing: string) => 
        existing.includes(missing.slice(0, -1)) || missing.includes(existing.slice(0, -1))
      );
      if (similar) {
        console.log(`  - Missing '${missing}' but found '${similar}'`);
      }
    });
    
    console.log("\n📊 Raw table data:", JSON.stringify(tables.slice(0, 3), null, 2));
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
  } catch (error) {
    console.error("❌ Error checking tables:", error);
  }
};

checkMissingTables(); 
import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function insertMigrations() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    const migrations = [
      [1710286800001, "1710286800001-AddUnlockCountToUser"],
      [1710286800002, "1710286800002-AddUnlockCountToUser"], 
      [1710286800003, "1710286800003-UpdateUnlockCountValues"],
      [1710286800004, "1710286800004-EnsureUnlockCountColumn"],
      [1710286800005, "1710286800005-UpdateUnlockCountValues"],
      [1710286800006, "1710286800006-UpdateUnlockCountValuesOnly"],
      [1746879404041, "1746879404041-AddWalletToUser"],
      [1747149663742, "1747149663742-AddPasswordResetFieldsToUser"],
      [1747179263639, "1747179263639-ManualAddSecurityFieldsToUser"],
      [1747185427914, "1747185427914-AddPaymentMethodsToUserAndCleanWallet"],
      [1747229161483, "1747229161483-UpdateAuditForeignKeysToEntityUseR"],
      [1747352341483, "1747352341483-UserSchemaSync"],
      [1747615378636, "1747615378636-UpdateBoardForGeneralPromotionAndRecruitSlotLogic"],
      [1747615378637, "1747615378637-CreateUnlockHistoryTable"],
      [1748533723642, "1748533723642-AddCreatorUserIdField"],
      [1748546237749, "1748546237749-AddCreatorUserIdField"],
      [1640000000001, "AddCanVerifyRecruitsToUser"],
      [1640000000002, "AddUnlockCountToUser"]
    ];
    
    let insertedCount = 0;
    
    for (const [timestamp, name] of migrations) {
      try {
        await AppDataSource.query(
          `INSERT INTO migrations (timestamp, name) VALUES (?, ?)`,
          [timestamp, name]
        );
        console.log(`✅ ${name}`);
        insertedCount++;
      } catch (error) {
        console.log(`⚠️  ${name}: ${(error as Error).message}`);
      }
    }
    
    console.log(`\n✅ ${insertedCount} migraciones insertadas`);
    
    const total = await AppDataSource.query(`SELECT COUNT(*) as count FROM migrations`);
    console.log(`📊 Total en tabla: ${total[0].count}`);
    
    await AppDataSource.destroy();
    console.log("✅ ¡Listo! Prueba npm run m:run");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

insertMigrations(); 
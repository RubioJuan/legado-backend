import "reflect-metadata";
import { AppDataSource } from "./config/db";

async function fixMigrationNames() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos");
    
    // Limpiar tabla
    await AppDataSource.query('TRUNCATE TABLE migrations');
    console.log("🧹 Tabla migrations limpiada");
    
    // Migraciones con nombres correctos (timestamp al final)
    const migrations = [
      [1678886500000, 'AddCanVerifyRecruitsToUser1678886500000'],
      [1710286800000, 'AddUnlockCountToUser1710286800000'],
      [1710286800001, 'AddUnlockCountToUser1710286800001'],
      [1710286800002, 'AddUnlockCountToUser1710286800002'],
      [1710286800003, 'UpdateUnlockCountValues1710286800003'],
      [1710286800004, 'EnsureUnlockCountColumn1710286800004'],
      [1710286800005, 'UpdateUnlockCountValues1710286800005'],
      [1710286800006, 'UpdateUnlockCountValuesOnly1710286800006'],
      [1746879404041, 'AddWalletToUser1746879404041'],
      [1747149663742, 'AddPasswordResetFieldsToUser1747149663742'],
      [1747179263639, 'ManualAddSecurityFieldsToUser1747179263639'],
      [1747185427914, 'AddPaymentMethodsToUserAndCleanWallet1747185427914'],
      [1747229161483, 'UpdateAuditForeignKeysToEntityUser1747229161483'],
      [1747352341483, 'UserSchemaSync1747352341483'],
      [1747615378636, 'UpdateBoardForGeneralPromotionAndRecruitSlotLogic1747615378636'],
      [1747615378637, 'CreateUnlockHistoryTable1747615378637'],
      [1748533723642, 'AddCreatorUserIdField1748533723642'],
      [1748546237749, 'AddCreatorUserIdField1748546237749']
    ];
    
    // Insertar cada migración
    for (const [timestamp, name] of migrations) {
      await AppDataSource.query(
        'INSERT INTO migrations (timestamp, name) VALUES (?, ?)',
        [timestamp, name]
      );
      console.log(`✅ ${name}`);
    }
    
    console.log(`\n🎉 ${migrations.length} migraciones insertadas correctamente`);
    
    await AppDataSource.destroy();
    console.log("✅ ¡Listo! Ahora prueba npm run m:run");
    
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

fixMigrationNames(); 
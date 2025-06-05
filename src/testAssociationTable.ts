import { AppDataSource } from "./config/db";
import { Association } from "./entities/association.entity";

const testAssociationTable = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection successful");

    // Try to query the association table
    const associationRepo = AppDataSource.getRepository(Association);
    
    // Check if we can query the table
    const count = await associationRepo.count();
    console.log(`✅ Association table accessible. Current count: ${count}`);
    
    // Try to insert a test record
    const testAssociation = new Association();
    const saved = await associationRepo.save(testAssociation);
    console.log(`✅ Test association created with ID: ${saved.id}`);
    
    // Clean up - remove the test record
    await associationRepo.remove(saved);
    console.log("✅ Test association removed");
    
    await AppDataSource.destroy();
    console.log("✅ Test completed successfully");
    
  } catch (error) {
    console.error("❌ Error testing association table:", error);
  }
};

testAssociationTable(); 
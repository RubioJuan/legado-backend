import "reflect-metadata";
import { AppDataSource } from "./config/db";
import { encrypt } from "./utils/bcrypt.handle";

const createMassiveUsers = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection established");

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const totalUsers = 400;
    const password = await encrypt("password123");

    console.log("Starting massive user creation...");
    console.log(`Target: ${totalUsers} users`);

    for (let i = 1; i <= totalUsers; i++) {
      const username = `user${i}`;

      await queryRunner.query(
        `INSERT INTO entity_user (
          username, password, firstName, lastName, country, countryCode, phoneNumber,
          idRole, idUserState, idUserProcessState, acceptMarketing,
          ballsSended, ballsReceived, ballsReceivedConfirmed, triplicationDone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username, password, username, username, "Colombia", "+57", "1234567890",
          2, 1, 1, true, 0, 0, 0, false
        ]
      );

      if (i % 50 === 0) {
        console.log(`Progress: ${i}/${totalUsers} users created`);
        await queryRunner.commitTransaction();
        await queryRunner.startTransaction();
      }
    }

    await queryRunner.commitTransaction();
    console.log("All users created successfully!");

  } catch (error) {
    console.error("Error:", error);
    throw error;
  } finally {
    try {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log("Database connection closed");
      }
    } catch (error) {
      console.error("Error closing connection:", error);
    }
  }
};

// Run the script
createMassiveUsers()
  .then(() => {
    console.log("Script finished successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("Script error:", error);
    process.exit(1);
  }); 
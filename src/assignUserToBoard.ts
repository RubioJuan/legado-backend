import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";
import { modifyAssosiationsOfUser } from "./services/user.service";
import { getPositionAvailable } from "./utils/getPositionAvailable";

async function assignUserToBoard() {
  console.log("Starting user assignment to board...");
  
  // Initialize the database connection
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Get the board
    const board = await queryRunner.manager.findOne(Board, {
      where: { id: 539 }
    });

    if (!board) {
      throw new Error("Board 539 not found");
    }

    // Get the user
    const user = await queryRunner.manager.findOne(EntityUser, {
      where: { id: 82 }
    });

    if (!user) {
      throw new Error("User 82 not found");
    }

    // Find available position
    const positionAvailable = getPositionAvailable(board);
    if (!positionAvailable) {
      throw new Error("No position available in board 539");
    }

    console.log(`Found available position: ${positionAvailable}`);

    // Update board with new user
    const boardUpdatePayload: { [key: string]: any } = {};
    boardUpdatePayload[positionAvailable] = user.id;
    await queryRunner.manager.update(Board, board.id, boardUpdatePayload);

    // Update user associations
    await modifyAssosiationsOfUser(user.id, positionAvailable, board, queryRunner);

    // Create subscription
    await queryRunner.manager.insert('subscription', {
      idUser: user.id,
      idBoard: board.id,
      idSubscriptionState: 1
    });

    // Update user state
    await queryRunner.manager.update(EntityUser, user.id, {
      idUserProcessState: 2 // PENDING_VERIFICATION
    });

    await queryRunner.commitTransaction();
    console.log(`Successfully assigned user ${user.id} to position ${positionAvailable} in board ${board.id}`);

  } catch (error) {
    console.error("Error:", error);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

assignUserToBoard()
  .then(() => console.log("Script completed"))
  .catch(error => console.error("Script failed:", error)); 
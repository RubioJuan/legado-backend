import { In } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script to force all users in board 498 to be visually unverified
 */
async function forceUnverifyBoard498() {
  console.log("Starting force unverify of all users in board 498...");
  
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("Database connection established");
    
    // Find board 498 with all positions
    const board = await AppDataSource.manager.findOne(Board, {
      where: { id: 498 }
    });
    
    if (!board) {
      console.error("Board 498 not found!");
      return;
    }
    
    console.log(`Found board 498 with state: ${board.idBoardState}`);
    
    // First, let's log all users and their verification states
    const userIds = [
      board.idGoalScorer,
      board.idCreator1, board.idCreator2,
      board.idGenerator1, board.idGenerator2, board.idGenerator3, board.idGenerator4,
      board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
      board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
    ].filter(id => id !== null) as number[];
    
    if (userIds.length > 0) {
      // Get current user states
      const users = await AppDataSource.manager.find(EntityUser, {
        where: { id: In(userIds) },
        select: ['id', 'username', 'idUserProcessState']
      });
      
      console.log("Current user states:");
      users.forEach(user => {
        console.log(`User ${user.username} (ID: ${user.id}) - Process State: ${user.idUserProcessState}`);
      });
      
      // Force all users to be in PENDING state (2)
      const updateResult = await AppDataSource.manager.update(
        EntityUser,
        { id: In(userIds) },
        { 
          idUserProcessState: 2 // PENDING_VERIFICATION
        }
      );
      
      console.log(`Forced ${updateResult.affected} users to PENDING verification state`);
    }
    
    // Also set the board itself to WAITING state (1) and clear any blockade
    await AppDataSource.manager.update(
      Board,
      { id: 498 },
      {
        idBoardState: 1, // WAITING
        currentBlockadeStage: null,
        isAwaitingUserCreation: false
      }
    );
    
    console.log("Board 498 set to WAITING state with no blockades");
    
    console.log("Board 498 forced unverify completed successfully!");
  } catch (error) {
    console.error("Error during force unverify:", error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
}

// Execute the function
forceUnverifyBoard498()
  .then(() => console.log("Script execution completed"))
  .catch(error => console.error("Script execution failed:", error)); 
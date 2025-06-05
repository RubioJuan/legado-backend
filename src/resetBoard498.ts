import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script to reset verification status of board 498 for testing purposes
 */
async function resetBoard498() {
  console.log("Starting reset of board 498...");
  
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("Database connection established");
    
    // Find board 498
    const board = await AppDataSource.manager.findOne(Board, {
      where: { id: 498 }
    });
    
    if (!board) {
      console.error("Board 498 not found!");
      return;
    }
    
    console.log(`Found board 498 with state: ${board.idBoardState}, blockade stage: ${board.currentBlockadeStage}`);
    
    // Reset board status
    await AppDataSource.manager.update(Board, 498, {
      idBoardState: 1, // Set to WAITING state
      currentBlockadeStage: null, // Remove blockade
      isAwaitingUserCreation: false // Reset flag for user creation
    });
    
    console.log("Board state reset successfully");
    
    // If needed, also reset associated users' verification status
    if (board.idGoalScorer) {
      await AppDataSource.manager.update(EntityUser, board.idGoalScorer, {
        idUserProcessState: 3, // Set to VALIDATING state
        ballsReceived: 0, // Reset balls received
        ballsReceivedConfirmed: 0,
        triplicationDone: false // Reset triplication status
      });
      
      console.log(`Goal scorer (user ID: ${board.idGoalScorer}) verification status reset`);
      
      // Also reset any children created for triplication
      const childrenCount = await AppDataSource.manager.count(EntityUser, {
        where: { triplicationOfId: board.idGoalScorer }
      });
      
      if (childrenCount > 0) {
        console.log(`Found ${childrenCount} children users created for triplication`);
        
        // Option 1: Delete children users (uncomment if needed)
        // await AppDataSource.manager.delete(EntityUser, { triplicationOfId: board.idGoalScorer });
        // console.log(`Deleted ${childrenCount} children users`);
        
        // Option 2: Update children users status (safer)
        await AppDataSource.manager.update(
          EntityUser,
          { triplicationOfId: board.idGoalScorer },
          { idUserProcessState: 1 } // Reset to initial state
        );
        console.log(`Reset status of ${childrenCount} children users`);
      }
    }
    
    console.log("Board 498 reset completed successfully!");
  } catch (error) {
    console.error("Error resetting board:", error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
}

// Execute the function
resetBoard498()
  .then(() => console.log("Script execution completed"))
  .catch(error => console.error("Script execution failed:", error)); 
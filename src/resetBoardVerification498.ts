import { In } from "typeorm";
import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script to reset verification status of ALL users in board 498 for testing purposes
 */
async function resetBoardVerification498() {
  console.log("Starting reset of all user verifications in board 498...");
  
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
    
    // Collect all user IDs from the board (excluding nulls)
    const userIds = [
      board.idGoalScorer,
      board.idCreator1, board.idCreator2,
      board.idGenerator1, board.idGenerator2, board.idGenerator3, board.idGenerator4,
      board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
      board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
    ].filter(id => id !== null) as number[];
    
    console.log(`Found ${userIds.length} users to reset in board 498`);
    
    if (userIds.length > 0) {
      // Reset verification status for all users in the board
      const updateResult = await AppDataSource.manager.update(
        EntityUser,
        { id: In(userIds) },
        { 
          idUserProcessState: 2, // Set to PENDING_VERIFICATION
          ballsReceived: 0,
          ballsReceivedConfirmed: 0
        }
      );
      
      console.log(`Reset ${updateResult.affected} users' verification status`);
    }
    
    // Also reset any children created for triplication if the general exists
    if (board.idGoalScorer) {
      const childrenCount = await AppDataSource.manager.count(EntityUser, {
        where: { triplicationOfId: board.idGoalScorer }
      });
      
      if (childrenCount > 0) {
        console.log(`Found ${childrenCount} children users created for triplication`);
        
        await AppDataSource.manager.update(
          EntityUser,
          { triplicationOfId: board.idGoalScorer },
          { idUserProcessState: 2 } // Set to PENDING_VERIFICATION
        );
        console.log(`Reset status of ${childrenCount} children users`);
      }
    }
    
    console.log("Board 498 verification reset completed successfully!");
  } catch (error) {
    console.error("Error resetting board verification:", error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
}

// Execute the function
resetBoardVerification498()
  .then(() => console.log("Script execution completed"))
  .catch(error => console.error("Script execution failed:", error)); 
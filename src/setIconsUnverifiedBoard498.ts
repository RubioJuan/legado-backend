import { AppDataSource } from "./config/db";
import { Board } from "./entities/board.entity";
import { UserProcessState } from "./entities/user-process-state.entity";
import { EntityUser } from "./entities/user.entity";

/**
 * Script to ensure all users in board 498 have their verification icons set to unverified
 * - Sets user_process_state to 2 (PENDING_VERIFICATION)
 * - Updates any other fields that might affect visualization
 */
async function setIconsUnverifiedBoard498() {
  console.log("Starting setting all users' icons to unverified in board 498...");
  
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
    
    // Set board to WAITING state
    await AppDataSource.manager.update(
      Board,
      { id: 498 },
      {
        idBoardState: 1, // WAITING
        currentBlockadeStage: null,
        isAwaitingUserCreation: false
      }
    );
    
    console.log("Board 498 set to WAITING state");
    
    // Collect all user IDs from the board (excluding nulls)
    const userIds = [
      board.idGoalScorer,
      board.idCreator1, board.idCreator2,
      board.idGenerator1, board.idGenerator2, board.idGenerator3, board.idGenerator4,
      board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
      board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8
    ].filter(id => id !== null) as number[];
    
    if (userIds.length === 0) {
      console.log("No users found in board 498!");
      return;
    }
    
    console.log(`Found ${userIds.length} users in board 498`);
    
    // First, get all process states to confirm what state ID should be used
    const processStates = await AppDataSource.manager.find(UserProcessState);
    console.log("Available process states:");
    processStates.forEach(state => {
      console.log(`ID: ${state.id} - Name: ${state.name}`);
    });
    
    // For each user, set their status to PENDING (2)
    for (const userId of userIds) {
      await AppDataSource.manager.update(
        EntityUser,
        { id: userId },
        {
          idUserProcessState: 2, // PENDING_VERIFICATION
          ballsReceived: 0,
          ballsReceivedConfirmed: 0
        }
      );
      console.log(`User ID ${userId} set to PENDING verification state`);
    }
    
    // Also check and reset any triplication users if needed
    if (board.idGoalScorer) {
      // Reset general's triplication status
      await AppDataSource.manager.update(
        EntityUser,
        { id: board.idGoalScorer },
        { triplicationDone: false }
      );
      
      // Reset any children created for triplication
      const childrenCount = await AppDataSource.manager.count(EntityUser, {
        where: { triplicationOfId: board.idGoalScorer }
      });
      
      if (childrenCount > 0) {
        console.log(`Found ${childrenCount} children users created for triplication`);
        
        // Option 1: Delete children if needed
        await AppDataSource.manager.delete(
          EntityUser,
          { triplicationOfId: board.idGoalScorer }
        );
        console.log(`Deleted ${childrenCount} children users for clean testing`);
      }
    }
    
    console.log("All users in board 498 set to unverified state!");
  } catch (error) {
    console.error("Error setting icons to unverified:", error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
}

// Execute the function
setIconsUnverifiedBoard498()
  .then(() => console.log("Script execution completed"))
  .catch(error => console.error("Script execution failed:", error)); 
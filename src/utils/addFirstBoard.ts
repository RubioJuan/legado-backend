import { Board } from "../entities/board.entity";

export const addFirstBoard = async () => {
  // Check if a board with idLevelId = 1 and idBoardState = 1 already exists
  const existingGenesisBoard = await Board.findOne({
    where: {
      idLevelId: 1,
      idBoardState: 1, // MODIFIED: Renamed from idBoardStateId
    },
  });

  if (!existingGenesisBoard) { // If no such board exists, then create one
    console.log("[addFirstBoard] No existing Level 1 'WaitingForPlayers' board found. Creating one.");
    const firstBoard = new Board();
    firstBoard.idBoardState = 1; // MODIFIED: Renamed from idBoardStateId
    firstBoard.idLevelId = 1;      // Level: Génesis
    // Ensure all player positions are initially null (TypeORM default or explicitly set if needed)
    firstBoard.idGoalScorer = null;
    firstBoard.idCreator1 = null;
    firstBoard.idCreator2 = null;
    firstBoard.idGenerator1 = null;
    firstBoard.idGenerator2 = null;
    firstBoard.idGenerator3 = null;
    firstBoard.idGenerator4 = null;
    firstBoard.idDefender1 = null;
    firstBoard.idDefender2 = null;
    firstBoard.idDefender3 = null;
    firstBoard.idDefender4 = null;
    firstBoard.idDefender5 = null;
    firstBoard.idDefender6 = null;
    firstBoard.idDefender7 = null;
    firstBoard.idDefender8 = null;
    await firstBoard.save(); // Ensure the save operation is awaited
    console.log("[addFirstBoard] New Level 1 'WaitingForPlayers' board created successfully.");
  } else {
    console.log("[addFirstBoard] Existing Level 1 'WaitingForPlayers' board found. No new board created.");
  }
};

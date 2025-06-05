import { Board } from "../entities/board.entity";

// Define un tipo específico para las claves de posición del jugador
type PlayerPositionKey =
  | "idGoalScorer" | "idCreator1" | "idCreator2"
  | "idGenerator1" | "idGenerator2" | "idGenerator3" | "idGenerator4"
  | "idDefender1" | "idDefender2" | "idDefender3" | "idDefender4"
  | "idDefender5" | "idDefender6" | "idDefender7" | "idDefender8";

export const getPositionAvailable = (board: Board): PlayerPositionKey | null => {
  try {
    let position: PlayerPositionKey | null = null; // Usa el tipo específico

    // Check if the EntityUser object itself is null
    if (board.idGoalScorer === null) {
      position = "idGoalScorer";
    } else if (board.idCreator1 === null) {
      position = "idCreator1";
    } else if (board.idCreator2 === null) {
      position = "idCreator2";
    } else if (board.idGenerator1 === null) {
      position = "idGenerator1";
    } else if (board.idGenerator2 === null) {
      position = "idGenerator2";
    } else if (board.idGenerator3 === null) {
      position = "idGenerator3";
    } else if (board.idGenerator4 === null) {
      position = "idGenerator4";
    } else if (board.idDefender1 === null) {
      position = "idDefender1";
    } else if (board.idDefender2 === null) {
      position = "idDefender2";
    } else if (board.idDefender3 === null) {
      position = "idDefender3";
    } else if (board.idDefender4 === null) {
      position = "idDefender4";
    } else if (board.idDefender5 === null) {
      position = "idDefender5";
    } else if (board.idDefender6 === null) {
      position = "idDefender6";
    } else if (board.idDefender7 === null) {
      position = "idDefender7";
    } else if (board.idDefender8 === null) {
      position = "idDefender8";
    }

    // Log the found position before returning
    console.log(`[getPositionAvailable] Found position: ${position} for Board ID: ${board.id}`);
    return position; // Return the determined position (PlayerPositionKey | null)
  } catch (error) {
    // return new Error(
    //   `Has been occurred a error checking a position available: ${error}`
    // );
    console.error(error);
    return null;
  }
};

export const getPositionsAvailables = (board: Board): string[] | null => {
  try {
    let listOfPositions: string[] = [];

    // Check if the EntityUser object itself is null
    if (board.idGoalScorer === null) {
      listOfPositions.push("idGoalScorer");
    }

    if (board.idCreator1 === null) {
      listOfPositions.push("idCreator1");
    }

    if (board.idCreator2 === null) {
      listOfPositions.push("idCreator2");
    }

    if (board.idGenerator1 === null) {
      listOfPositions.push("idGenerator1");
    }

    if (board.idGenerator2 === null) {
      listOfPositions.push("idGenerator2");
    }

    if (board.idGenerator3 === null) {
      listOfPositions.push("idGenerator3");
    }

    if (board.idGenerator4 === null) {
      listOfPositions.push("idGenerator4");
    }

    if (board.idDefender1 === null) {
      listOfPositions.push("idDefender1");
    }

    if (board.idDefender2 === null) {
      listOfPositions.push("idDefender2");
    }

    if (board.idDefender3 === null) {
      listOfPositions.push("idDefender3");
    }

    if (board.idDefender4 === null) {
      listOfPositions.push("idDefender4");
    }

    if (board.idDefender5 === null) {
      listOfPositions.push("idDefender5");
    }

    if (board.idDefender6 === null) {
      listOfPositions.push("idDefender6");
    }

    if (board.idDefender7 === null) {
      listOfPositions.push("idDefender7");
    }

    if (board.idDefender8 === null) {
      listOfPositions.push("idDefender8");
    }

    return listOfPositions;
  } catch (error) {
    // return new Error(
    //   `Has been occurred a error checking a position available: ${error}`
    // );
    console.error(error);
    return null;
  }
};

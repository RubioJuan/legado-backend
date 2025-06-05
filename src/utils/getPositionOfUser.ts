//Type
import { BoardExt } from "../interfaces/board.interface";
import { GetBoardMock, GetVerifyBoardMock } from "../interfaces/mock.interface";
import { PositionOfUser } from "../types/index.types";

export const getPositionOfUser = (idUser: number, board: BoardExt | any) => {
  try {
    if (board.idGoalScorer?.id === idUser) {
      return "idGoalScorer";
    }

    if (board.idCreator1?.id === idUser) {
      return "idCreator1";
    }

    if (board.idCreator2?.id === idUser) {
      return "idCreator2";
    }

    if (board.idGenerator1?.id === idUser) {
      return "idGenerator1";
    }

    if (board.idGenerator2?.id === idUser) {
      return "idGenerator2";
    }

    if (board.idGenerator3?.id === idUser) {
      return "idGenerator3";
    }

    if (board.idGenerator4?.id === idUser) {
      return "idGenerator4";
    }

    if (board.idDefender1?.id === idUser) {
      return "idDefender1";
    }

    if (board.idDefender2?.id === idUser) {
      return "idDefender2";
    }

    if (board.idDefender3?.id === idUser) {
      return "idDefender3";
    }

    if (board.idDefender4?.id === idUser) {
      return "idDefender4";
    }

    if (board.idDefender5?.id === idUser) {
      return "idDefender5";
    }

    if (board.idDefender6?.id === idUser) {
      return "idDefender6";
    }

    if (board.idDefender7?.id === idUser) {
      return "idDefender7";
    }

    if (board.idDefender8?.id === idUser) {
      return "idDefender8";
    }

    return null;
  } catch (error) {
    return null;
    // return new Error(
    //   `Has been occurred a error checking a position available: ${error}`
    // );
    console.error(error);
  }
};

export const getPositionOfUserV2 = (
  username: string,
  board: GetVerifyBoardMock | GetBoardMock
): PositionOfUser => {
  if (board.goalScorer.username === username) return "goalScorer";

  if (board.creator1.username === username) return "creator1";

  if (board.creator2.username === username) return "creator2";

  if (board.generator1.username === username) return "generator1";

  if (board.generator2.username === username) return "generator2";

  if (board.generator3.username === username) return "generator3";

  if (board.generator4.username === username) return "generator4";

  if (board.defender1.username === username) return "defender1";

  if (board.defender2.username === username) return "defender2";

  if (board.defender3.username === username) return "defender3";

  if (board.defender4.username === username) return "defender4";

  if (board.defender5.username === username) return "defender5";

  if (board.defender6.username === username) return "defender6";

  if (board.defender7.username === username) return "defender7";

  if (board.defender8.username === username) return "defender8";

  return null;
};

// REVERTED/ADJUSTED definition expecting number IDs
type PlayerPositionKey =
  | "idGoalScorer" | "idCreator1" | "idCreator2"
  | "idGenerator1" | "idGenerator2" | "idGenerator3" | "idGenerator4"
  | "idDefender1" | "idDefender2" | "idDefender3" | "idDefender4"
  | "idDefender5" | "idDefender6" | "idDefender7" | "idDefender8";
  
export const getPositionOfUserr = (
  userId: number,
  // Use an inline type that matches the expected structure with number IDs
  board: {
    idGoalScorer: number | null;
    idCreator1: number | null;
    idCreator2: number | null;
    idGenerator1: number | null;
    idGenerator2: number | null;
    idGenerator3: number | null;
    idGenerator4: number | null;
    idDefender1: number | null;
    idDefender2: number | null;
    idDefender3: number | null;
    idDefender4: number | null;
    idDefender5: number | null;
    idDefender6: number | null;
    idDefender7: number | null;
    idDefender8: number | null;
  }
): PlayerPositionKey | null => {
  // Compare directly with the number ID
  if (board.idGoalScorer === userId) {
    return "idGoalScorer";
  }

  if (board.idCreator1 === userId) {
    return "idCreator1";
  }

  if (board.idCreator2 === userId) {
    return "idCreator2";
  }

  if (board.idGenerator1 === userId) {
    return "idGenerator1";
  }

  if (board.idGenerator2 === userId) {
    return "idGenerator2";
  }

  if (board.idGenerator3 === userId) {
    return "idGenerator3";
  }

  if (board.idGenerator4 === userId) {
    return "idGenerator4";
  }

  if (board.idDefender1 === userId) {
    return "idDefender1";
  }

  if (board.idDefender2 === userId) {
    return "idDefender2";
  }

  if (board.idDefender3 === userId) {
    return "idDefender3";
  }

  if (board.idDefender4 === userId) {
    return "idDefender4";
  }

  if (board.idDefender5 === userId) {
    return "idDefender5";
  }

  if (board.idDefender6 === userId) {
    return "idDefender6";
  }

  if (board.idDefender7 === userId) {
    return "idDefender7";
  }

  if (board.idDefender8 === userId) {
    return "idDefender8";
  }

  return null;
};

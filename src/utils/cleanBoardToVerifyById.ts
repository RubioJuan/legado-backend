// Type
import { GetVerifyBoardMock } from "../interfaces/mock.interface";

export const cleanBoardToVerifyById = (board: any): GetVerifyBoardMock => {
  const boardClean: GetVerifyBoardMock = {} as GetVerifyBoardMock;

  boardClean.id = board.id;

  boardClean.level = board.idLevel.name;

  boardClean.state = board.idBoardState.name;

  if (!board.idGoalScorer?.id) {
    throw new Error("El ID del goalScorer es requerido");
  }

  boardClean.goalScorer = {
    id: board.idGoalScorer.id,
    username: board.idGoalScorer?.username,
    phoneNumber: board.idGoalScorer?.phoneNumber,
    state: board.idGoalScorer?.userProcessState?.name,
    ballsSended: board.idGoalScorer?.ballsSended || 0,
    ballsReceived: board.idGoalScorer?.ballsReceived || 0,
    ballsReceivedConfirmed: board.idGoalScorer?.ballsReceivedConfirmed || 0,
    triplicationDone: board.idGoalScorer?.triplicationDone || false,
  };

  boardClean.creator1 = {
    username: board.idCreator1?.username,
    phoneNumber: board.idCreator1?.phoneNumber,
    state: board.idCreator1?.userProcessState?.name,
  };

  boardClean.creator2 = {
    username: board.idCreator2?.username,
    phoneNumber: board.idCreator2?.phoneNumber,
    state: board.idCreator2?.userProcessState?.name,
  };

  boardClean.generator1 = {
    username: board.idGenerator1?.username,
    phoneNumber: board.idGenerator1?.phoneNumber,
    state: board.idGenerator1?.userProcessState?.name,
  };

  boardClean.generator2 = {
    username: board.idGenerator2?.username,
    phoneNumber: board.idGenerator2?.phoneNumber,
    state: board.idGenerator2?.userProcessState?.name,
  };

  boardClean.generator3 = {
    username: board.idGenerator3?.username,
    phoneNumber: board.idGenerator3?.phoneNumber,
    state: board.idGenerator3?.userProcessState?.name,
  };

  boardClean.generator4 = {
    username: board.idGenerator4?.username,
    phoneNumber: board.idGenerator4?.phoneNumber,
    state: board.idGenerator4?.userProcessState?.name,
  };

  boardClean.defender1 = {
    username: board.idDefender1?.username,
    phoneNumber: board.idDefender1?.phoneNumber,
    state: board.idDefender1?.userProcessState?.name,
  };

  boardClean.defender2 = {
    username: board.idDefender2?.username,
    phoneNumber: board.idDefender2?.phoneNumber,
    state: board.idDefender2?.userProcessState?.name,
  };

  boardClean.defender3 = {
    username: board.idDefender3?.username,
    phoneNumber: board.idDefender3?.phoneNumber,
    state: board.idDefender3?.userProcessState?.name,
  };

  boardClean.defender4 = {
    username: board.idDefender4?.username,
    phoneNumber: board.idDefender4?.phoneNumber,
    state: board.idDefender4?.userProcessState?.name,
  };

  boardClean.defender5 = {
    username: board.idDefender5?.username,
    phoneNumber: board.idDefender5?.phoneNumber,
    state: board.idDefender5?.userProcessState?.name,
  };

  boardClean.defender6 = {
    username: board.idDefender6?.username,
    phoneNumber: board.idDefender6?.phoneNumber,
    state: board.idDefender6?.userProcessState?.name,
  };

  boardClean.defender7 = {
    username: board.idDefender7?.username,
    phoneNumber: board.idDefender7?.phoneNumber,
    state: board.idDefender7?.userProcessState?.name,
  };

  boardClean.defender8 = {
    username: board.idDefender8?.username,
    phoneNumber: board.idDefender8?.phoneNumber,
    state: board.idDefender8?.userProcessState?.name,
  };

  boardClean.createAt = board.createAt;

  return boardClean;
};

export const cleanBoardToVerificatePlayer = (board: any): GetVerifyBoardMock => {
  // Log para ver qué trae 'board' que viene de getHydratedBoardForVerification
  console.log('[Util - cleanBoardToVerificatePlayer] Input board object:', JSON.stringify(board));

  const boardClean: GetVerifyBoardMock = {
    id: board.id,
    goalScorer: {
      username: board.idGoalScorer?.username,
      phoneNumber: board.idGoalScorer?.phoneNumber,
      state: board.idGoalScorer?.userProcessState?.name, // Asumiendo que userProcessState tiene name
      ballsSended: board.idGoalScorer?.ballsSended,
      ballsReceived: board.idGoalScorer?.ballsReceived,
      ballsReceivedConfirmed: board.idGoalScorer?.ballsReceivedConfirmed,
      triplicationDone: board.idGoalScorer?.triplicationDone,
      id: board.idGoalScorer?.id
    },
    creator1: {
      username: board.idCreator1?.username,
      phoneNumber: board.idCreator1?.phoneNumber,
      state: board.idCreator1?.userProcessState?.name,
      id: board.idCreator1?.id
    },
    creator2: {
      username: board.idCreator2?.username,
      phoneNumber: board.idCreator2?.phoneNumber,
      state: board.idCreator2?.userProcessState?.name,
      id: board.idCreator2?.id
    },
    generator1: {
      username: board.idGenerator1?.username,
      phoneNumber: board.idGenerator1?.phoneNumber,
      state: board.idGenerator1?.userProcessState?.name,
      id: board.idGenerator1?.id
    },
    generator2: {
      username: board.idGenerator2?.username,
      phoneNumber: board.idGenerator2?.phoneNumber,
      state: board.idGenerator2?.userProcessState?.name,
      id: board.idGenerator2?.id
    },
    generator3: {
      username: board.idGenerator3?.username,
      phoneNumber: board.idGenerator3?.phoneNumber,
      state: board.idGenerator3?.userProcessState?.name,
      id: board.idGenerator3?.id
    },
    generator4: {
      username: board.idGenerator4?.username,
      phoneNumber: board.idGenerator4?.phoneNumber,
      state: board.idGenerator4?.userProcessState?.name,
      id: board.idGenerator4?.id
    },
    defender1: {
      username: board.idDefender1?.username,
      phoneNumber: board.idDefender1?.phoneNumber,
      state: board.idDefender1?.userProcessState?.name,
      id: board.idDefender1?.id
    },
    defender2: {
      username: board.idDefender2?.username,
      phoneNumber: board.idDefender2?.phoneNumber,
      state: board.idDefender2?.userProcessState?.name,
      id: board.idDefender2?.id
    },
    defender3: {
      username: board.idDefender3?.username,
      phoneNumber: board.idDefender3?.phoneNumber,
      state: board.idDefender3?.userProcessState?.name,
      id: board.idDefender3?.id
    },
    defender4: {
      username: board.idDefender4?.username,
      phoneNumber: board.idDefender4?.phoneNumber,
      state: board.idDefender4?.userProcessState?.name,
      id: board.idDefender4?.id
    },
    defender5: {
      username: board.idDefender5?.username,
      phoneNumber: board.idDefender5?.phoneNumber,
      state: board.idDefender5?.userProcessState?.name,
      id: board.idDefender5?.id
    },
    defender6: {
      username: board.idDefender6?.username,
      phoneNumber: board.idDefender6?.phoneNumber,
      state: board.idDefender6?.userProcessState?.name,
      id: board.idDefender6?.id
    },
    defender7: {
      username: board.idDefender7?.username,
      phoneNumber: board.idDefender7?.phoneNumber,
      state: board.idDefender7?.userProcessState?.name,
      id: board.idDefender7?.id
    },
    defender8: {
      username: board.idDefender8?.username,
      phoneNumber: board.idDefender8?.phoneNumber,
      state: board.idDefender8?.userProcessState?.name,
      id: board.idDefender8?.id
    },
    level: board.idLevel?.name,
    idLevelId: board.idLevelId,
    state: board.idBoardState?.id,
    currentBlockadeStage: board.currentBlockadeStage,
    createAt: board.createAt,
  };
  console.log('[Util - cleanBoardToVerificatePlayer] Output boardClean object:', JSON.stringify(boardClean));
  return boardClean;
};

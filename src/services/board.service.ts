// Type
import {
  Equal,
  In,
  IsNull,
  Not,
  QueryRunner
} from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
  GetVerifyBoardMock,
  GetVerifyGoalScorerMock
} from "../interfaces/mock.interface";
import { BoardLevel, BoardLevelNumericId, BoardStateNumericId, UserProcessStateId } from "../types/enums.types";

//Config
import { AppDataSource } from "../config/db";

//Interfaces
import {
  AssignPlayerRequest,
  FormUpdatePlayer,
  ServiceResponse,
  UpdatePlayerRequest,
} from "../interfaces/admin.request.interface";
import { BoardExt } from "../interfaces/board.interface";
import { LoginUserData, User } from "../interfaces/user.interface";

//Entities
import { BoardState } from "../entities/board-state.entity"; // CORRECTED PATH
import { Board } from "../entities/board.entity"; // <<< USAR Board consistentemente
import { GeneralAwaitingRecruitSlot, WaitingReason } from "../entities/GeneralAwaitingRecruitSlot"; // <<< NUEVA IMPORTACIÓN
import { Level } from "../entities/level.entity";
import { Subscription } from "../entities/subscription.entity"; // <<< IMPORTADO Subscription
import { EntityUser } from "../entities/user.entity";

//Utils
import { encrypt } from "../utils/bcrypt.handle";
import { cleanBoardToGetBoardById } from "../utils/cleanBoardToGetBoardById";
import {
  getPositionAvailable,
  getPositionsAvailables,
} from "../utils/getPositionAvailable";
import { getUserDataInfo } from "../utils/getUserDataInfo";

//Services
import {
  cleanBoardToVerificatePlayer
} from "../utils/cleanBoardToVerifyById";
import { notificatePushGotOutTail } from "./notificationsPush.onesignal.service";
import { playerVerify } from "./playerVerify.service";
import { notificateGotOutTail } from "./sms.twilio.service";
import {
  eraseUserTailByIdTail,
  getUserTailToInsertOnNewBoard,
} from "./tail.service";
import {
  modifyAssosiationsOfUser,
  modifyUserById,
  readUserByUsername
} from "./user.service";

// Define the return type alias
const GOAL_SCORER_PROMOTION_THRESHOLD = 1; // TODO: Definir si este es el valor correcto para cuando un GS es promovido
const BOARD_STATE_ACTIVE_ID = 1; // Asumiendo 1 es "Activo" o "EsperandoJugadores"

export type PromotionServiceResponse = {
    message: string;
    status: number; // ADDED: status field
    promotedToBoardId?: number;
    splitBoardA_Id?: number;
    splitBoardB_Id?: number;
  };

export const getStadiumsService = async () => {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  try {
    const boards = await queryRunner.manager.find(Board, {
      relations: [
        "idGoalScorer",
        "idCreator1",
        "idCreator2",
        "idGenerator1",
        "idGenerator2",
        "idGenerator3",
        "idGenerator4",
        "idDefender1",
        "idDefender2",
        "idDefender3",
        "idDefender4",
        "idDefender5",
        "idDefender6",
        "idDefender7",
        "idDefender8",
      ],
      where: {
        idBoardState: Not(4), // MODIFIED
        idLevelId: In([1]), // CORRECTED
      },
    });

    const clean: any = [...boards];

    const clear = clean.map((board: any) => {
      const proccess = {
        goleador: {
          nombre: board.idGoalScorer.firstName,
          apellido: board.idGoalScorer.lastName,
          pais: board.idGoalScorer.country,
          codigoDePais: board.idGoalScorer.countryCode,
          telefono: board.idGoalScorer.phoneNumber,
          usuario: board.idGoalScorer.username,
        },
        creador1: {
          nombre: board.idCreator1.firstName,
          apellido: board.idCreator1.lastName,
          pais: board.idCreator1.country,
          codigoDePais: board.idCreator1.countryCode,
          telefono: board.idCreator1.phoneNumber,
          usuario: board.idCreator1.username,
        },
        creador2: {
          nombre: board.idCreator2.firstName,
          apellido: board.idCreator2.lastName,
          pais: board.idCreator2.country,
          codigoDePais: board.idCreator2.countryCode,
          telefono: board.idCreator2.phoneNumber,
          usuario: board.idCreator2.username,
        },
        generador1: {
          nombre: board.idGenerator1.firstName,
          apellido: board.idGenerator1.lastName,
          pais: board.idGenerator1.country,
          codigoDePais: board.idGenerator1.countryCode,
          telefono: board.idGenerator1.phoneNumber,
          usuario: board.idGenerator1.username,
        },
        generador2: {
          nombre: board.idGenerator2.firstName,
          apellido: board.idGenerator2.lastName,
          pais: board.idGenerator2.country,
          codigoDePais: board.idGenerator2.countryCode,
          telefono: board.idGenerator2.phoneNumber,
          usuario: board.idGenerator2.username,
        },
        generador3: {
          nombre: board.idGenerator3.firstName,
          apellido: board.idGenerator3.lastName,
          pais: board.idGenerator3.country,
          codigoDePais: board.idGenerator3.countryCode,
          telefono: board.idGenerator3.phoneNumber,
          usuario: board.idGenerator3.username,
        },
        generador4: {
          nombre: board.idGenerator4.firstName,
          apellido: board.idGenerator4.lastName,
          pais: board.idGenerator4.country,
          codigoDePais: board.idGenerator4.countryCode,
          telefono: board.idGenerator4.phoneNumber,
          usuario: board.idGenerator4.username,
        },
        defensa1: {
          nombre: board?.idDefender1?.firstName,
          apellido: board?.idDefender1?.lastName,
          pais: board?.idDefender1?.country,
          codigoDePais: board?.idDefender1?.countryCode,
          telefono: board?.idDefender1?.phoneNumber,
          usuario: board?.idDefender1?.username,
        },
        defensa2: {
          nombre: board?.idDefender2?.firstName,
          apellido: board?.idDefender2?.lastName,
          pais: board?.idDefender2?.country,
          codigoDePais: board?.idDefender2?.countryCode,
          telefono: board?.idDefender2?.phoneNumber,
          usuario: board?.idDefender2?.username,
        },
        defensa3: {
          nombre: board?.idDefender3?.firstName,
          apellido: board?.idDefender3?.lastName,
          pais: board?.idDefender3?.country,
          codigoDePais: board?.idDefender3?.countryCode,
          telefono: board?.idDefender3?.phoneNumber,
          usuario: board?.idDefender3?.username,
        },
        defensa4: {
          nombre: board?.idDefender4?.firstName,
          apellido: board?.idDefender4?.lastName,
          pais: board?.idDefender4?.country,
          codigoDePais: board?.idDefender4?.countryCode,
          telefono: board?.idDefender4?.phoneNumber,
          usuario: board?.idDefender4?.username,
        },
        defensa5: {
          nombre: board?.idDefender5?.firstName,
          apellido: board?.idDefender5?.lastName,
          pais: board?.idDefender5?.country,
          codigoDePais: board?.idDefender5?.countryCode,
          telefono: board?.idDefender5?.phoneNumber,
          usuario: board?.idDefender5?.username,
        },
        defensa6: {
          nombre: board?.idDefender6?.firstName,
          apellido: board?.idDefender6?.lastName,
          pais: board?.idDefender6?.country,
          codigoDePais: board?.idDefender6?.countryCode,
          telefono: board?.idDefender6?.phoneNumber,
          usuario: board?.idDefender6?.username,
        },
        defensa7: {
          nombre: board?.idDefender7?.firstName,
          apellido: board?.idDefender7?.lastName,
          pais: board?.idDefender7?.country,
          codigoDePais: board?.idDefender7?.countryCode,
          telefono: board?.idDefender7?.phoneNumber,
          usuario: board?.idDefender7?.username,
        },
        defensa8: {
          nombre: board?.idDefender8?.firstName,
          apellido: board?.idDefender8?.lastName,
          pais: board?.idDefender8?.country,
          codigoDePais: board?.idDefender8?.countryCode,
          telefono: board?.idDefender8?.phoneNumber,
          usuario: board?.idDefender8?.username,
        },
      };
      return proccess;
    });

    return clear;
  } catch (error) {
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};
export const insertBoard = async (idLevel: number) => {
  try {
    const newBoard = new Board();

    newBoard.idLevelId = idLevel; // CORRECTED
    newBoard.idBoardState = 1; // MODIFIED

    const responseInserNewBoard = await newBoard.save();
    return responseInserNewBoard;
  } catch (error) {
    return new Error(`${error}`);
  }
};

export const searchAllBoards = async () => {
  const allBoards = await Board.find();
  return allBoards;
};

export const searchBoardById = async (idBoard: number) => {
  const board = await Board.findOne({
    where: { id: idBoard },
    loadRelationIds: true,
  });
  return board;
};

export const searchBoardForGetBoard = async (idBoard: number) => {
  const board = await Board.findOne({
    where: { id: idBoard },
    // REMOVED relations array as they don't exist on the Board entity
    /*
    relations: [
      "idLevel",
      "idBoardState",
      "idGoalScorer",
      "idGoalScorer.idCaptain",
      "idGoalScorer.idUserProcessState",
      "idCreator1",
      "idCreator1.idUserProcessState",
      "idCreator2",
      "idCreator2.idUserProcessState",
      "idGenerator1",
      "idGenerator1.idUserProcessState",
      "idGenerator2",
      "idGenerator2.idUserProcessState",
      "idGenerator3",
      "idGenerator3.idUserProcessState",
      "idGenerator4",
      "idGenerator4.idUserProcessState",
      "idDefender1",
      "idDefender1.idUserProcessState",
      "idDefender2",
      "idDefender2.idUserProcessState",
      "idDefender3",
      "idDefender3.idUserProcessState",
      "idDefender4",
      "idDefender4.idUserProcessState",
      "idDefender5",
      "idDefender5.idUserProcessState",
      "idDefender6",
      "idDefender6.idUserProcessState",
      "idDefender7",
      "idDefender7.idUserProcessState",
      "idDefender8",
      "idDefender8.idUserProcessState",
    ],
    */
  });

  console.log('[Service - searchBoardForGetBoard] Raw board data from DB for ID ' + idBoard + ':', JSON.stringify(board, null, 2)); // DEBUG LOG 5

  if (!board) return null;

  const response = await cleanBoardToGetBoardById(board);
  console.log('[Service - searchBoardForGetBoard] Cleaned board data for ID ' + idBoard + ':', JSON.stringify(response, null, 2)); // DEBUG LOG 6

  return response;
};

export const getHydratedBoardForVerification = async (idBoard: number) => {
  console.log(`[Service - getHydratedBoardForVerification] Fetching full board data for ID: ${idBoard}`);

  // 1. Fetch the base board to get all player IDs and relation IDs
  const boardWithOnlyIds = await Board.findOne({ where: { id: idBoard } });

  if (!boardWithOnlyIds) {
    console.error(`[Service - getHydratedBoardForVerification] Board with ID ${idBoard} not found.`);
    return null;
  }

  console.log('[Service - getHydratedBoardForVerification] Board fetched (IDs only):', JSON.stringify(boardWithOnlyIds));

  // 2. Collect all unique player IDs from the board
  const playerPositionIdFieldsOnBoard: (keyof Board)[] = [
    'idGoalScorer', 'idCreator1', 'idCreator2',
    'idGenerator1', 'idGenerator2', 'idGenerator3', 'idGenerator4',
    'idDefender1', 'idDefender2', 'idDefender3', 'idDefender4',
    'idDefender5', 'idDefender6', 'idDefender7', 'idDefender8'
  ];

  const playerIds = playerPositionIdFieldsOnBoard
    .map(field => boardWithOnlyIds[field])
    .filter((id): id is number => typeof id === 'number' && id !== null); // Ensure only valid numbers

  const uniquePlayerIds = [...new Set(playerIds)];
  console.log('[Service - getHydratedBoardForVerification] Unique Player IDs found on board:', uniquePlayerIds);

  // 3. Fetch Level, BoardState, and all unique Users with their process state in parallel
  const [levelEntity, boardStateEntity, usersWithRelation] = await Promise.all([
    boardWithOnlyIds.idLevelId ? Level.findOne({ where: { id: boardWithOnlyIds.idLevelId } }) : Promise.resolve(null),
    boardWithOnlyIds.idBoardState ? BoardState.findOne({ where: { id: boardWithOnlyIds.idBoardState } }) : Promise.resolve(null),
    uniquePlayerIds.length > 0 ? EntityUser.find({
      where: { id: In(uniquePlayerIds) },
      relations: ["userProcessState"] // Load the nested userProcessState relation
    }) : Promise.resolve([])
  ]);

  // Log fetched related data
  console.log('[Service - getHydratedBoardForVerification] Level fetched:', JSON.stringify(levelEntity));
  console.log('[Service - getHydratedBoardForVerification] BoardState fetched:', JSON.stringify(boardStateEntity));
  console.log('[Service - getHydratedBoardForVerification] Users fetched:', JSON.stringify(usersWithRelation.map(u => ({id: u.id, username: u.username, state: u.userProcessState?.name}))));

  // Basic validation if related entities were found (optional, but good practice)
  if (!levelEntity) {
      console.warn(`[Service - getHydratedBoardForVerification] Level entity not found for idLevelId: ${boardWithOnlyIds.idLevelId} on board ${idBoard}.`);
  }
  if (!boardStateEntity) {
      console.warn(`[Service - getHydratedBoardForVerification] BoardState entity not found for idBoardState: ${boardWithOnlyIds.idBoardState} on board ${idBoard}.`);
  }
  if (usersWithRelation.length !== uniquePlayerIds.length) {
      console.warn(`[Service - getHydratedBoardForVerification] Mismatch between requested player IDs (${uniquePlayerIds.length}) and fetched users (${usersWithRelation.length}). Some users might not exist.`);
  }

  // 4. Create a map for easy lookup of hydrated users
  const usersMap = new Map<number, EntityUser>();
  usersWithRelation.forEach(user => usersMap.set(user.id, user));

  // 5. Construct the fully hydrated board object for cleaning
  //    We manually assemble the object structure expected by cleanBoardToVerificatePlayer
  const hydratedBoardForCleaning: any = {
    ...boardWithOnlyIds, // Start with the base board IDs
    // Overwrite relation IDs with the fetched entities/objects
    idLevel: levelEntity, // Pass the full Level object if needed by cleaner, or just levelEntity.id / levelEntity.name
    idBoardState: boardStateEntity, // Pass the full BoardState object
    // Map player IDs back to their hydrated EntityUser objects
    idGoalScorer: boardWithOnlyIds.idGoalScorer ? usersMap.get(boardWithOnlyIds.idGoalScorer) : null,
    idCreator1: boardWithOnlyIds.idCreator1 ? usersMap.get(boardWithOnlyIds.idCreator1) : null,
    idCreator2: boardWithOnlyIds.idCreator2 ? usersMap.get(boardWithOnlyIds.idCreator2) : null,
    idGenerator1: boardWithOnlyIds.idGenerator1 ? usersMap.get(boardWithOnlyIds.idGenerator1) : null,
    idGenerator2: boardWithOnlyIds.idGenerator2 ? usersMap.get(boardWithOnlyIds.idGenerator2) : null,
    idGenerator3: boardWithOnlyIds.idGenerator3 ? usersMap.get(boardWithOnlyIds.idGenerator3) : null,
    idGenerator4: boardWithOnlyIds.idGenerator4 ? usersMap.get(boardWithOnlyIds.idGenerator4) : null,
    idDefender1: boardWithOnlyIds.idDefender1 ? usersMap.get(boardWithOnlyIds.idDefender1) : null,
    idDefender2: boardWithOnlyIds.idDefender2 ? usersMap.get(boardWithOnlyIds.idDefender2) : null,
    idDefender3: boardWithOnlyIds.idDefender3 ? usersMap.get(boardWithOnlyIds.idDefender3) : null,
    idDefender4: boardWithOnlyIds.idDefender4 ? usersMap.get(boardWithOnlyIds.idDefender4) : null,
    idDefender5: boardWithOnlyIds.idDefender5 ? usersMap.get(boardWithOnlyIds.idDefender5) : null,
    idDefender6: boardWithOnlyIds.idDefender6 ? usersMap.get(boardWithOnlyIds.idDefender6) : null,
    idDefender7: boardWithOnlyIds.idDefender7 ? usersMap.get(boardWithOnlyIds.idDefender7) : null,
    idDefender8: boardWithOnlyIds.idDefender8 ? usersMap.get(boardWithOnlyIds.idDefender8) : null,
    // Explicitly add idLevelId if cleanBoardToVerificatePlayer needs it
    idLevelId: boardWithOnlyIds.idLevelId
  };

  // Log the object being sent to the cleaner
   console.log('[Service - getHydratedBoardForVerification] Hydrated object being sent to cleanBoardToVerificatePlayer:', JSON.stringify(hydratedBoardForCleaning, (key, value) => key === 'password' ? undefined : value)); // Avoid logging passwords


  // 6. Clean the hydrated board data using the utility function
  //    cleanBoardToVerificatePlayer MUST be adapted to handle this new structure
  //    (expecting full user objects in idGoalScorer etc., and potentially full Level/BoardState)
  const cleanedBoard = cleanBoardToVerificatePlayer(hydratedBoardForCleaning);

  console.log('[Service - getHydratedBoardForVerification] Board data cleaned successfully.');

  return cleanedBoard; // Return the cleaned data structure expected by the middleware/controller
};

export const searchBoardByIdWhitRelations = async (idBoard: number) => {
  const board = await Board.findOne({
    where: { id: idBoard },
    relations: [
      "idLevel",
      "idBoardState",
      "idGoalScorer",
      "idGoalScorer.idCaptain",
      "idGoalScorer.idUserProcessState",
      "idCreator1",
      "idCreator1.idUserProcessState",
      "idCreator2",
      "idCreator2.idUserProcessState",
      "idGenerator1",
      "idGenerator1.idUserProcessState",
      "idGenerator2",
      "idGenerator2.idUserProcessState",
      "idGenerator3",
      "idGenerator3.idUserProcessState",
      "idGenerator4",
      "idGenerator4.idUserProcessState",
      "idDefender1",
      "idDefender1.idUserProcessState",
      "idDefender2",
      "idDefender2.idUserProcessState",
      "idDefender3",
      "idDefender3.idUserProcessState",
      "idDefender4",
      "idDefender4.idUserProcessState",
      "idDefender5",
      "idDefender5.idUserProcessState",
      "idDefender6",
      "idDefender6.idUserProcessState",
      "idDefender7",
      "idDefender7.idUserProcessState",
      "idDefender8",
      "idDefender8.idUserProcessState",
    ],

    // loadRelationIds: true,
    // select: { createAt: true },
  });
  return board;
};

export const modifyBoardById = async (
  idBoard: number,
  boardData: QueryDeepPartialEntity<Board>
) => {
  const response = await Board.update({ id: In([idBoard]) }, boardData);
  return response;
};

export const checkBoardByLevel = async (idLevel: number) => {
  try {
    const checkIs = await Board.findOne({
      where: { idLevelId: In([idLevel]) }, // CORRECTED
    });

    if (checkIs) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return new Error(`${error}`);
  }
};

export const getBoardWhitPositionAvailable = async (levelId: number) => {
  try {
    const response = await AppDataSource.getRepository(Board).findOne({
    where: {
        idLevelId: levelId,
        idBoardState: 1, // MODIFIED: Estado 1 = WaitingForPlayers
      },
      // REMOVED relations: because player positions are now IDs, not loadable relations
      // relations: [
      //   "idGoalScorer",
      //   "idCreator1",
      //   "idCreator2",
      //   "idGenerator1",
      //   "idGenerator2",
      //   "idGenerator3",
      //   "idGenerator4",
      //   "idDefender1",
      //   "idDefender2",
      //   "idDefender3",
      //   "idDefender4",
      //   "idDefender5",
      //   "idDefender6",
      //   "idDefender7",
      //   "idDefender8",
      // ],
    order: {
      createAt: "ASC",
    },
    });

    console.log(`[getBoardWhitPositionAvailable] Query Result for level ${levelId}, state 1:`, response);
    console.log(`[getBoardWhitPositionAvailable] Found board: ${response ? response.id : 'null'}`);
    if (response) {
      // console.log( '[Service - getBoardWhitPositionAvailable] Checking board for available positions:', response );
      const playerPositions = [
        "idGoalScorer", "idCreator1", "idCreator2",
        "idGenerator1", "idGenerator2", "idGenerator3", "idGenerator4",
        "idDefender1", "idDefender2", "idDefender3", "idDefender4",
        "idDefender5", "idDefender6", "idDefender7", "idDefender8"
      ];
      const hasAvailablePosition = playerPositions.some(
        (pos) => response[pos as keyof Board] === null
      );

      if (hasAvailablePosition) {
        // console.log('[Service - getBoardWhitPositionAvailable] Board has available positions.');
        return response;
      } else {
        // console.log('[Service - getBoardWhitPositionAvailable] Board found by query, but all positions are filled.');
        return null; // Board is full, so it's not "available" for new player assignment
      }
    }
    return null;
  } catch (error) {
    throw new Error(`ERROR FINDING BOARD AVAILABLE: ${error}`);
  }
};

export const validateLockBoardLevel1 = async (
  board: any,
  totalValidating: number,
  idDefender: number
) => {
  if (totalValidating === 3) {
    //Block board
    const response1 = await modifyBoardById(board.id, { idBoardState: 3 }); // MODIFIED
    //Change to validating state user
    const response2 = await modifyUserById(idDefender, {
      idUserProcessState: 3,
    });

    if (
      !!response1.affected &&
      !!response2.affected &&
      response1.affected > 0 &&
      response2.affected > 0
    ) {
      return "Éxito, se ha realizado la solicitud de validación, el tablero ha sido bloqueado.";
    }

    return "ERROR WHILE MODIFY BOARD DATA";
  } else {
    //Change to validating state user
    const response1 = await modifyUserById(idDefender, {
      idUserProcessState: 3,
    });

    if (!!response1.affected && response1.affected > 0) {
      return "Éxito, se ha realizado la solicitud de validación.";
    }

    return "ERROR WHILE MODIFY DATA OF USERS";
  }
};

export const validateLockBoardLevel2 = async (
  board: any,
  idDefender: number,
  totalUsersValidating: number,
  totalDefendersValidating: number
) => {
  if (
    (!(totalUsersValidating % 2 === 0) || totalDefendersValidating === 6) &&
    totalDefendersValidating !== 7
  ) {
    //Block board
    const response1 = await modifyBoardById(board.id, { idBoardState: 3 }); // MODIFIED
    //Change to validating state user
    const response2 = await modifyUserById(idDefender, {
      idUserProcessState: 3,
    });

    if (
      response1.affected !== undefined &&
      response2.affected !== undefined &&
      response1.affected > 0 &&
      response2.affected > 0
    ) {
      return "Éxito, se ha realizado la solicitud de validación, el tablero ha sido bloqueado.";
    }

    return "ERROR WHILE MODIFY BOARD DATA";
  } else {
    //Change to validating state user
    const response1 = await modifyUserById(idDefender, {
      idUserProcessState: 3,
    });

    if (response1.affected !== undefined && response1.affected > 0) {
      return "Éxito, se ha realizado la solicitud de validación.";
    }

    return "ERROR WHILE MODIFY DATA OF USERS";
  }
};

export const validateLockBoardLevel3 = async (
  board: any,
  idDefender: number
) => {
  const { ballsReceived, idCaptain, idUserProcessState } = board.idGoalScorer;
  const idGoalScorer = board.idGoalScorer.id;
  const idUserProcessStateGoalScorer = idUserProcessState.id;

  if (!!idCaptain && idUserProcessStateGoalScorer === 4) {
    const responseUpdateDefender = await modifyUserById(idDefender, {
      idUserProcessState: 3,
    });
    if (
      !!responseUpdateDefender.affected &&
      responseUpdateDefender.affected > 0
    ) {
      return "Éxito, se ha realizado la solicitud de validación.";
    } else {
      return "ERROR WHILE GET VERIFY";
    }
  } else {
    if (
      (!!idCaptain &&
        ballsReceived <= 28 &&
        (!(ballsReceived % 2 === 0) || ballsReceived === 28)) ||
      (!idCaptain &&
        ballsReceived <= 52 &&
        (!(ballsReceived % 2 === 0) || ballsReceived === 52))
    ) {
      const response1 = await modifyUserById(idGoalScorer, {
        ballsReceived: ballsReceived + 1,
      });
      const response2 = await modifyUserById(idDefender, {
        idUserProcessState: 3,
      });
      const response3 = await modifyBoardById(board.id, { idBoardState: 3 }); // MODIFIED

      if (
        response1.affected !== undefined &&
        response1.affected > 0 &&
        response2.affected !== undefined &&
        response2.affected > 0 &&
        response3.affected !== undefined &&
        response3.affected > 0
      ) {
        return "Éxito, se ha realizado la solicitud de validación, el tablero ha sido bloqueado.";
      }

      return "ERROR WHILE MODIFY DATA OF USERS";
    }

    if (
      (!!idCaptain && ballsReceived > 28) ||
      (!idCaptain && ballsReceived > 52)
    ) {
      const response = await modifyUserById(idDefender, {
        idUserProcessState: 3,
      });

      if (response.affected !== undefined && response.affected > 0) {
        return "Éxito, se ha realizado la solicitud de validación.";
      } else {
        return "ERROR WHILE MODIFY DATA OF USERS";
      }
    }

    const response1 = await modifyUserById(idGoalScorer, {
      ballsReceived: ballsReceived + 1,
    });
    const response2 = await modifyUserById(idDefender, {
      idUserProcessState: 3,
    });

    if (
      response1.affected !== undefined &&
      response1.affected > 0 &&
      response2.affected !== undefined &&
      response2.affected > 0
    ) {
      return "Éxito, se ha realizado la solicitud de validación.";
    }

    return "ERROR WHILE MODIFY DATA OF USERS";

    // if (!(totalUsersValidating % 2 === 0) || totalDefendersValidating === 6) {
    //   //Block board
    //   const response1 = await modifyBoardById(board.id, { idBoardStateId: 3 });
    //   //Change to validating state user
    //   const response2 = await modifyUserById(idDefender, {
    //     idUserProcessState: 3,
    //   });

    //   if (
    //     response1.affected !== undefined &&
    //     response2.affected !== undefined &&
    //     response1.affected > 0 &&
    //     response2.affected > 0
    //   ) {
    //     return "SUCCESS";
    //   }

    //   return "ERROR WHILE MODIFY BOARD DATA";
    // } else {
    //   //Change to validating state user
    //   const response1 = await modifyUserById(idDefender, {
    //     idUserProcessState: 3,
    //   });

    //   if (response1.affected !== undefined && response1.affected > 0) {
    //     return "SUCCESS";
    //   }

    //   return "ERROR WHILE MODIFY DATA OF USERS";
    // }
  }
};

export const validateLockBoardLevel4 = async (idDefender: number) => {
  // const idDefender = defender.id;
  // const { ballsSended } = defender;
  // const { ballsReceived, idCaptain } = board.idGoalScorer;
  // const idGoalScorer = board.idGoalScorer.id;
  const updateForDefender: any = {};
  updateForDefender.idUserProcessState = 3;
  // const updateForGoalScorer: any = {};
  // updateForGoalScorer.ballsReceived = ballsReceived + 1;

  // const responseUpdateGoalScorer = await modifyUserById(
  //   idGoalScorer,
  //   updateForGoalScorer
  // );

  // if (ballsSended < 29) {
  // }

  const responseUpdateDefender = await modifyUserById(
    idDefender,
    updateForDefender
  );
  if (
    !!responseUpdateDefender.affected &&
    responseUpdateDefender.affected > 0
  ) {
    return "Éxito, se ha realizado la solicitud de validación.";
  } else {
    return "ERROR WHILE GET VERIFY";
  }
};

export const getIdBoardState = (board: BoardExt | any): number => {
  // Assuming the input 'board' might still be an old structure with nested object
  // or the new structure with direct ID. Prioritize the direct ID.
  if (board.idBoardState !== undefined) {
      return board.idBoardState;
  } 
  // Fallback for potential old structure (less likely now)
  else if (board.idBoardState && typeof board.idBoardState === 'object' && board.idBoardState.id !== undefined) {
     console.warn("[getIdBoardState] Used fallback for nested idBoardState.id");
  return board.idBoardState.id;
  } 
  // Fallback if idBoardState is directly the number (very old structure?)
  else if (typeof board.idBoardState === 'number') { 
     console.warn("[getIdBoardState] Used fallback for direct idBoardState number");
     return board.idBoardState;
  }
  console.error("[getIdBoardState] Could not determine board state ID from board:", board);
  throw new Error("Could not determine board state ID.");
};

export const closeBoard = async (board: any, idLastUserForValidate: number) => {
  const queryRunner = AppDataSource.createQueryRunner(); // Define queryRunner
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try { // Add try block for transaction management
    // Attempt to derive levelIdNumeric similar to closeBoardService
    // This assumes 'board' might have a 'level' property like GetVerifyBoardMock
    // or an 'idLevel' object with an 'id' property, or directly 'idLevelId'.
    // We need to be careful here as 'board: any' is not specific.
    // Let's assume 'board.idLevel.id' as a common pattern for entities.
    // If 'board.idLevel' is already a number (like board.idLevelId), this needs adjustment.
    // For now, we'll try with board.idLevel.id and if it's a direct number, it should be board.idLevelId
    let levelIdNumeric: number | null = null;
    if (board.idLevel && typeof board.idLevel === 'object' && board.idLevel.id) {
      levelIdNumeric = board.idLevel.id;
    } else if (board.idLevelId && typeof board.idLevelId === 'number') {
      levelIdNumeric = board.idLevelId;
    } else if (board.level && typeof board.level === 'string') { // Handle GetVerifyBoardMock like structure
        levelIdNumeric =
        board.level === BoardLevel.OLÍMPICO
            ? 1
            : board.level === BoardLevel.CENTENARIO
            ? 2
            : board.level === BoardLevel.AZTECA
            ? 3
            : null; // Add other levels if necessary
    }

    if (levelIdNumeric === null) {
      // If levelIdNumeric could not be determined, throw an error or handle as appropriate
      // For now, we'll log and potentially let it fail if it's used later with null.
      console.error("[Service - closeBoard] Could not determine levelIdNumeric from board:", board);
      // Depending on requirements, you might throw an error here:
      // throw new Error("Could not determine level ID for new boards in closeBoard.");
    }

    const newBoard1 = queryRunner.manager.create(Board, {
      idLevelId: levelIdNumeric === null ? undefined : levelIdNumeric, // CORRECTED: null vs undefined
      idBoardState: 1, 
      idGoalScorer: board.idCreator1, 
      idCreator1: board.idGenerator1,
      idCreator2: board.idGenerator2,
      idGenerator1: board.idDefender1,
      idGenerator2: board.idDefender2,
      idGenerator3: board.idDefender3,
      idGenerator4: board.idDefender4,
    });
    const newBoard2 = queryRunner.manager.create(Board, {
      idLevelId: levelIdNumeric === null ? undefined : levelIdNumeric, // CORRECTED: null vs undefined
      idBoardState: 1, 
      idGoalScorer: board.idCreator2, 
      idCreator1: board.idGenerator3,
      idCreator2: board.idGenerator4,
      idGenerator1: board.idDefender5,
      idGenerator2: board.idDefender6,
      idGenerator3: board.idDefender7,
      idGenerator4: board.idDefender8,
    });

    if (board.idLevelId === 1) { // CORRECTED: Use idLevelId
    const usersInTail = await getUserTailToInsertOnNewBoard();
    const group1 = usersInTail[0];
    const group2 = usersInTail[1];
    if (group1?.length > 0) {
      group1.forEach(async (userOnTail) => {
          const positionAvailable = getPositionAvailable(newBoard1 as any); 
        if (positionAvailable) {
          const userOnTailData = getUserDataInfo(userOnTail);
            (newBoard1 as any)[positionAvailable] = userOnTailData.id; 
          if (positionAvailable === "idDefender8") {
            newBoard1.idBoardState = 2;
          }
          await eraseUserTailByIdTail(userOnTail.id);
          await modifyUserById(userOnTailData.id, {
              idCaptain: newBoard1.idGoalScorer === null ? undefined : newBoard1.idGoalScorer, // CORRECTED
            idUserProcessState: 2,
          });
          await modifyAssosiationsOfUser(
            userOnTailData.id,
            positionAvailable,
            newBoard1,
            queryRunner! // ADDED ! for non-null assertion
          );
          await notificateGotOutTail(userOnTailData);
          await notificatePushGotOutTail(userOnTailData);
        }
      });
    }

    if (group2?.length > 0) {
      group2.forEach(async (userOnTail) => {
          const positionAvailable = getPositionAvailable(newBoard2 as any); 
        if (positionAvailable) {
          const userOnTailData = getUserDataInfo(userOnTail);
            (newBoard2 as any)[positionAvailable] = userOnTailData.id; 
          if (positionAvailable === "idDefender8") {
            newBoard2.idBoardState = 2;
          }
          await eraseUserTailByIdTail(userOnTail.id);
          await modifyUserById(userOnTailData.id, {
              idCaptain: newBoard2.idGoalScorer === null ? undefined : newBoard2.idGoalScorer, // CORRECTED
            idUserProcessState: 2,
          });
          await modifyAssosiationsOfUser(
            userOnTailData.id,
            positionAvailable,
            newBoard2,
            queryRunner! // ADDED ! for non-null assertion
          );
          await notificateGotOutTail(userOnTailData);
          await notificatePushGotOutTail(userOnTailData);
        }
      });
    }
  }

    // The following block was part of the diff, adapting it from closeBoardService.
    // However, the original closeBoard had different logic for saving and updating users.
    // Reverting to a structure closer to original closeBoard's presumed intent,
    // while ensuring the 'id' access errors are fixed in the original logic if it were to be restored.
    // For now, I'll keep the structure from the previous apply-model diff but fix its internal errors.
    // The original closeBoard's user updates were:
    // const response1 = await modifyUserById(idLastUserForValidate, { idUserProcessState: 4 });
    // if (board1.idGoalScorer !== null) { modifyUserById(board1.idGoalScorer, { idUserProcessState: 1 }); }
    // if (board2.idGoalScorer !== null) { modifyUserById(board2.idGoalScorer, { idUserProcessState: 1 }); }
    // const response4 = await modifyBoardById(board.id, { idBoardStateId: 4 });

    // This part of the code was changed significantly by the previous edit model.
    // The original closeBoard's logic for saving boards and updating users was different.
    // The current version below (from the previous edit attempt) tries to mirror closeBoardService.
    // I will ensure the 'id' access is correct for this structure.
    // And remove 'shouldReleaseQueryRunner' as it's always local.

    const savedBoard1 = await queryRunner.manager.save(newBoard1); // board1 in original linter error
    const savedBoard2 = await queryRunner.manager.save(newBoard2); // board2 in original linter error

    await modifyUserById(idLastUserForValidate, { // This was response1 in original
    idUserProcessState: 4,
  });

    if (savedBoard1.idGoalScorer !== null) {
      await modifyUserById(savedBoard1.idGoalScorer, { // Corrected access
    idUserProcessState: 1,
  });
    }
    
    if (savedBoard2.idGoalScorer !== null) {
      await modifyUserById(savedBoard2.idGoalScorer, { // Corrected access
    idUserProcessState: 1,
  });
    }

    await modifyBoardById(board.id, { idBoardState: 4 }); // MODIFIED

    // The return logic needs to be consistent. Original returned "BOARD CLOSED" or "ERROR WHILE DIVIDE BOARDS"
    // The previous edit changed it to return { message, status }.
    // For now, let's assume the { message, status } is the desired new format for this function,
    // and ensure it commits.

    await queryRunner.commitTransaction(); // Commit directly

    return { // Return type was changed by previous edit model.
      message: `Se cerró el campo de juego y se procesaron las divisiones (si aplicaba).`,
      status: 200,
    };
  } catch (error) { 
    console.error("[Service - closeBoard] Error in transaction:", error);
    await queryRunner.rollbackTransaction();
    throw error; 
  } finally { 
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const closeBoardFinal = async (board: any) => {
  const queryRunner = AppDataSource.createQueryRunner(); 
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try { 
  const newBoard1 = new Board();
    newBoard1.idLevelId = board.idLevelId; // CORRECTED
    newBoard1.idBoardState = 1; // MODIFIED
    newBoard1.idGoalScorer = typeof board.idCreator1 === 'object' ? board.idCreator1.id : board.idCreator1;
    newBoard1.idCreator1 = typeof board.idGenerator1 === 'object' ? board.idGenerator1.id : board.idGenerator1;
    newBoard1.idCreator2 = typeof board.idGenerator2 === 'object' ? board.idGenerator2.id : board.idGenerator2;
    newBoard1.idGenerator1 = typeof board.idDefender1 === 'object' ? board.idDefender1.id : board.idDefender1;
    newBoard1.idGenerator2 = typeof board.idDefender2 === 'object' ? board.idDefender2.id : board.idDefender2;
    newBoard1.idGenerator3 = typeof board.idDefender3 === 'object' ? board.idDefender3.id : board.idDefender3;
    newBoard1.idGenerator4 = typeof board.idDefender4 === 'object' ? board.idDefender4.id : board.idDefender4;

  const newBoard2 = new Board();
    newBoard2.idLevelId = board.idLevelId; // CORRECTED
    newBoard2.idBoardState = 1; // MODIFIED
    newBoard2.idGoalScorer = typeof board.idCreator2 === 'object' ? board.idCreator2.id : board.idCreator2;
    newBoard2.idCreator1 = typeof board.idGenerator3 === 'object' ? board.idGenerator3.id : board.idGenerator3;
    newBoard2.idCreator2 = typeof board.idGenerator4 === 'object' ? board.idGenerator4.id : board.idGenerator4;
    newBoard2.idGenerator1 = typeof board.idDefender5 === 'object' ? board.idDefender5.id : board.idDefender5;
    newBoard2.idGenerator2 = typeof board.idDefender6 === 'object' ? board.idDefender6.id : board.idDefender6;
    newBoard2.idGenerator3 = typeof board.idDefender7 === 'object' ? board.idDefender7.id : board.idDefender7;
    newBoard2.idGenerator4 = typeof board.idDefender8 === 'object' ? board.idDefender8.id : board.idDefender8;

    const savedBoard1 = await queryRunner.manager.save(newBoard1);
    const savedBoard2 = await queryRunner.manager.save(newBoard2);

    let mainGoalScorerUpdateAffected = true;
    let newBoard1GoalScorerUpdateAffected = true;
    let newBoard2GoalScorerUpdateAffected = true;
    let closeBoardUpdateAffected = false;

    const currentLevelId = board.idLevelId; // CORRECTED

    if (currentLevelId === 3) {
      const goalScorerEntity = board.idGoalScorer; // This might be an ID or an entity
      const goalScorerId = typeof goalScorerEntity === 'object' && goalScorerEntity !== null ? goalScorerEntity.id : goalScorerEntity;

      if (goalScorerId && typeof goalScorerId === 'number') {
        const updateGoalScorer = await modifyUserById(goalScorerId, { 
          ballsReceived: 0,
          ballsReceivedConfirmed: 0, // Corregido
          ballsSended: 0,
        });
        mainGoalScorerUpdateAffected = !!updateGoalScorer.affected && updateGoalScorer.affected > 0;
      } else {
        console.warn("[Service - closeBoardFinal] Original board's idGoalScorer or its ID is null/undefined or not a number. Skipping its update. Value:", board.idGoalScorer);
      }

      if (savedBoard1.idGoalScorer !== null) { 
    const updateGoalScorerNewBoard1 = await modifyUserById(
          savedBoard1.idGoalScorer, // CORRECTED
      {
        idUserProcessState: 1,
      }
    );
        newBoard1GoalScorerUpdateAffected = !!updateGoalScorerNewBoard1.affected && updateGoalScorerNewBoard1.affected > 0;
      } else {
          console.warn("[Service - closeBoardFinal] savedBoard1.idGoalScorer is null. Skipping user update.");
      }

      if (savedBoard2.idGoalScorer !== null) {
    const updateGoalScorerNewBoard2 = await modifyUserById(
          savedBoard2.idGoalScorer, // CORRECTED
      {
        idUserProcessState: 1,
      }
    );
        newBoard2GoalScorerUpdateAffected = !!updateGoalScorerNewBoard2.affected && updateGoalScorerNewBoard2.affected > 0;
      } else {
          console.warn("[Service - closeBoardFinal] savedBoard2.idGoalScorer is null. Skipping user update.");
      }
      
    const responseCloseBoard = await modifyBoardById(board.id, {
        idBoardState: 4, // MODIFIED
      });
      closeBoardUpdateAffected = !!responseCloseBoard.affected && responseCloseBoard.affected > 0;

      if (
        savedBoard1 &&
        savedBoard2 &&
        mainGoalScorerUpdateAffected &&
        newBoard1GoalScorerUpdateAffected &&
        newBoard2GoalScorerUpdateAffected &&
        closeBoardUpdateAffected
      ) {
        await queryRunner.commitTransaction(); // Commit before returning success
      return "BOARD CLOSED";
    } else {
        // Log which update failed if possible
        console.error(`[Service - closeBoardFinal] Error closing board level 3. mainGoalScorerUpdateAffected: ${mainGoalScorerUpdateAffected}, newBoard1GoalScorerUpdateAffected: ${newBoard1GoalScorerUpdateAffected}, newBoard2GoalScorerUpdateAffected: ${newBoard2GoalScorerUpdateAffected}, closeBoardUpdateAffected: ${closeBoardUpdateAffected}`);
        await queryRunner.rollbackTransaction(); // Rollback on error
        return "ERROR WHILE CLOSE BOARD LEVEL 3";
    }
    } else if (currentLevelId === 4) {
    const responseCloseBoard = await modifyBoardById(board.id, {
        idBoardState: 4, // MODIFIED
    });
    if (
        savedBoard1 &&
        savedBoard2 &&
      !!responseCloseBoard.affected &&
      responseCloseBoard.affected > 0
    ) {
        await queryRunner.commitTransaction(); // Commit before returning success
      return "BOARD CLOSED";
    } else {
        // Log which update failed if possible
        console.error(`[Service - closeBoardFinal] Error closing board level 4. savedBoard1.idGoalScorer: ${savedBoard1.idGoalScorer !== null}, savedBoard2.idGoalScorer: ${savedBoard2.idGoalScorer !== null}`);
        await queryRunner.rollbackTransaction(); // Rollback on error
        return "ERROR WHILE CLOSE BOARD LEVEL 4";
      }
    }

    return "LOGIC ERROR: Board level not processed in closeBoardFinal";
  } catch (error) { // Add catch block
    console.error("[Service - closeBoardFinal] Transaction failed, attempting rollback...", error);
    await queryRunner.rollbackTransaction();
    console.error("[Service - closeBoardFinal] Transaction failed and rolled back.");
    return { 
      message: error instanceof Error ? error.message : 'Error desconocido durante la promoción revertida.',
      status: 500 
    };
  } finally { // Add finally block
    if (!queryRunner.isReleased) {
      await queryRunner.release();
      console.log("[Service - closeBoardFinal] QueryRunner released.");
    }
  }
};

// Define the expected structure for each subscription item in the array
export interface UserSubscriptionInfo {
  id: number; // Subscription ID
  board: {
    id: number; // Board ID
    level: number; // Board Level ID (1, 2, 3, 4)
    // state?: number; // Optional: Board State ID, if needed by frontend
  };
  // idUser?: number; // Optional: User ID, if needed
  // idSubscriptionState?: number; // Optional: Subscription State ID, if needed
}

export const searchSubscriptionsOfUser = async (
  idUser: number
): Promise<UserSubscriptionInfo[]> => {
  console.log(`[Service - searchSubscriptionsOfUser] User ID TO SEARCH FOR: ${idUser} - START`); 

  let activeSubscriptionsRaw: Array<{ id: number; idUser: number; idBoard: number; idSubscriptionState: number }>; 

  try {
    console.log(`[Service - searchSubscriptionsOfUser] Constructing query for User ID: ${idUser} using QueryBuilder`);
    activeSubscriptionsRaw = await AppDataSource.getRepository(Subscription)
      .createQueryBuilder("subscription") 
      .select([
        "subscription.id AS id", 
        "subscription.idUser AS idUser",
        "subscription.idBoard AS idBoard",
        "subscription.idSubscriptionState AS idSubscriptionState"
      ])
      .where("subscription.idUser = :userId", { userId: idUser })
      .andWhere("subscription.idSubscriptionState = :state", { state: 1 }) // Active subscriptions
      .getRawMany(); 

  } catch (error) {
    console.error(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - ERROR fetching activeSubscriptions:`, error);
    return []; // Correct: Return empty array on error
  }

  console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - Active Subscriptions from DB (raw QueryBuilder result):`, activeSubscriptionsRaw); 

  if (!activeSubscriptionsRaw || activeSubscriptionsRaw.length === 0) {
    console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - No active subscriptions found. Returning empty array.`);
    return []; // Correct: Return empty array if no subscriptions
  }

  const boardIds = activeSubscriptionsRaw.map(sub => sub.idBoard).filter(id => id !== null && id !== undefined) as number[];

  if (boardIds.length === 0) {
      console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - No valid board IDs extracted. Returning empty array.`);
      return []; // Correct: Return empty array if no valid board IDs
  }
  console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - Extracted Board IDs: ${boardIds.join(', ')}`);

  let boardsAssociatedWithSubscriptions: Board[];
  try {
    boardsAssociatedWithSubscriptions = await AppDataSource.getRepository(Board).find({
        where: {
            id: In(boardIds),
            idBoardState: Not(Equal(4)) // Consider boards not in 'Closed' state (ID 4)
        },
        select: ["id", "idLevelId", "idBoardState"] // Select only necessary fields
    });
  } catch (error) {
    console.error(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - ERROR fetching boards by IDs:`, error);
    return []; // Correct: Return empty array on error
  }

  console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - Boards fetched from DB:`, JSON.stringify(boardsAssociatedWithSubscriptions, null, 2));

  if (!boardsAssociatedWithSubscriptions || boardsAssociatedWithSubscriptions.length === 0) {
      console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - No relevant boards found. Returning empty array.`);
       return []; // Correct: Return empty array if no relevant boards
  }

  // Map the raw subscriptions and their corresponding boards to the UserSubscriptionInfo structure
  const userSubscriptionsResult: UserSubscriptionInfo[] = activeSubscriptionsRaw
    .map(rawSub => {
      const boardDetails = boardsAssociatedWithSubscriptions.find(b => b.id === rawSub.idBoard);
      if (boardDetails) {
  return {
          id: rawSub.id, // Subscription ID
          board: {
            id: boardDetails.id, // Board ID
            level: boardDetails.idLevelId, // Board Level ID
          }
        };
      }
      return null; // If board details not found for a subscription (should ideally not happen if data is consistent)
    })
    .filter(subInfo => subInfo !== null) as UserSubscriptionInfo[]; // Filter out any nulls

  console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - Final response array to be returned:`, JSON.stringify(userSubscriptionsResult, null, 2));
  console.log(`[Service - searchSubscriptionsOfUser] User ID: ${idUser} - END`);
  return userSubscriptionsResult;
};

export const getPositionBasedOnAssosiation = (
  boardOfCaptain: any,
  idGoalScorer: number
) => {
  if (boardOfCaptain.idGoalScorer?.idLeftAssociation.id === idGoalScorer) {
    return "idCreator1";
  }
  if (boardOfCaptain.idGoalScorer?.idRightAssociation.id === idGoalScorer) {
    return "idCreator2";
  }
  if (boardOfCaptain.idCreator1?.idLeftAssociation.id === idGoalScorer) {
    return "idGenerator1";
  }
  if (boardOfCaptain.idCreator1?.idRightAssociation.id === idGoalScorer) {
    return "idGenerator2";
  }
  if (boardOfCaptain.idCreator2?.idLeftAssociation.id === idGoalScorer) {
    return "idGenerator3";
  }
  if (boardOfCaptain.idCreator2?.idRightAssociation.id === idGoalScorer) {
    return "idGenerator4";
  }
  if (boardOfCaptain.idGenerator1?.idLeftAssociation.id === idGoalScorer) {
    return "idDefender1";
  }
  if (boardOfCaptain.idGenerator1?.idRightAssociation.id === idGoalScorer) {
    return "idDefender2";
  }
  if (boardOfCaptain.idGenerator2?.idLeftAssociation.id === idGoalScorer) {
    return "idDefender3";
  }
  if (boardOfCaptain.idGenerator2?.idRightAssociation.id === idGoalScorer) {
    return "idDefender4";
  }
  if (boardOfCaptain.idGenerator3?.idLeftAssociation.id === idGoalScorer) {
    return "idDefender5";
  }
  if (boardOfCaptain.idGenerator3?.idRightAssociation.id === idGoalScorer) {
    return "idDefender6";
  }
  if (boardOfCaptain.idGenerator4?.idLeftAssociation.id === idGoalScorer) {
    return "idDefender7";
  }
  if (boardOfCaptain.idGenerator4?.idRightAssociation.id === idGoalScorer) {
    return "idDefender8";
  }
  return null;
};

export const getBoardLockOnBeforeLevelByIdGoalScorer = async (
  idUser: number,
  idActualLevel: number
) => {
  const boardOfGoalScorer = await Board.findOne({
    where: {
      idBoardState: In([3]), // MODIFIED
      idGoalScorer: In([idUser]),
      idLevelId: In([idActualLevel - 1]), // CORRECTED
    },
    relations: [
      "idLevel",
      "idGoalScorer",
      "idCreator1",
      "idCreator2",
      "idGenerator1",
      "idGenerator2",
      "idGenerator3",
      "idGenerator4",
      "idDefender1.idUserProcessState",
      "idDefender2.idUserProcessState",
      "idDefender3.idUserProcessState",
      "idDefender4.idUserProcessState",
      "idDefender5.idUserProcessState",
      "idDefender6.idUserProcessState",
      "idDefender7.idUserProcessState",
      "idDefender8.idUserProcessState",
    ],
  });
  return boardOfGoalScorer;
};

export const getBoardWaitingOfCaptain = async (
  idCaptain: number,
  idLevel: number
) => {
  const boardOfCaptain = await Board.findOne({
    where: {
      idGoalScorer: In([idCaptain]),
      idBoardState: In([1]), // MODIFIED
      idLevelId: In([idLevel]), // CORRECTED
    },
    relations: [
      "idLevel",
      "idGoalScorer",
      "idGoalScorer.idLeftAssociation",
      "idGoalScorer.idRightAssociation",
      "idCreator1",
      "idCreator1.idLeftAssociation",
      "idCreator1.idRightAssociation",
      "idCreator2",
      "idCreator2.idLeftAssociation",
      "idCreator2.idRightAssociation",
      "idGenerator1",
      "idGenerator1.idLeftAssociation",
      "idGenerator1.idRightAssociation",
      "idGenerator2",
      "idGenerator2.idLeftAssociation",
      "idGenerator2.idRightAssociation",
      "idGenerator3",
      "idGenerator3.idLeftAssociation",
      "idGenerator3.idRightAssociation",
      "idGenerator4",
      "idGenerator4.idLeftAssociation",
      "idGenerator4.idRightAssociation",
      "idDefender1",
      "idDefender1.idLeftAssociation",
      "idDefender1.idRightAssociation",
      "idDefender2",
      "idDefender2.idLeftAssociation",
      "idDefender2.idRightAssociation",
      "idDefender3",
      "idDefender3.idLeftAssociation",
      "idDefender3.idRightAssociation",
      "idDefender4",
      "idDefender4.idLeftAssociation",
      "idDefender4.idRightAssociation",
      "idDefender5",
      "idDefender5.idLeftAssociation",
      "idDefender5.idRightAssociation",
      "idDefender6",
      "idDefender6.idLeftAssociation",
      "idDefender6.idRightAssociation",
      "idDefender7",
      "idDefender7.idLeftAssociation",
      "idDefender7.idRightAssociation",
      "idDefender8",
      "idDefender8.idLeftAssociation",
      "idDefender8.idRightAssociation",
    ],
  });
  return boardOfCaptain;
};

export const assignPlayerService = async (
  goalScorerUsername: string,
  playerData: User,
  queryRunner?: QueryRunner
): Promise<ServiceResponse> => {
  let localQueryRunner: QueryRunner;
  let shouldReleaseQueryRunner = false;

  if (!queryRunner) {
    localQueryRunner = AppDataSource.createQueryRunner();
    await localQueryRunner.connect();
    await localQueryRunner.startTransaction();
    shouldReleaseQueryRunner = true;
  } else {
    localQueryRunner = queryRunner;
  }

  try {
    // Verificar si es un usuario hijo
    const isChildUser = playerData.creatorUserId !== undefined && playerData.creatorUserId !== null;
    console.log(`[Service - assignPlayerService] Assigning ${isChildUser ? 'child' : 'regular'} user ${playerData.username}`);

    if (!playerData.id) {
      throw new Error('ID de usuario no válido');
    }

    // Obtener el usuario goal scorer con sus suscripciones
    const goalScorer = await localQueryRunner.manager.findOne(EntityUser, {
      where: { username: goalScorerUsername },
      relations: ['subscriptions']
    });

    if (!goalScorer) {
      throw new Error(`Usuario ${goalScorerUsername} no encontrado.`);
    }

    // Obtener la suscripción activa
    const activeSubscription = goalScorer.subscriptions?.find((sub: Subscription) => sub.idSubscriptionState === 1);
    if (!activeSubscription) {
      throw new Error(`No se encontró una suscripción activa para el usuario ${goalScorerUsername}`);
    }

    // Obtener el tablero activo
    const currentBoard = await localQueryRunner.manager.findOne(Board, {
      where: { id: activeSubscription.idBoard }
    });

    if (!currentBoard) {
      throw new Error(`No se encontró el tablero activo para el usuario ${goalScorerUsername}`);
    }

    let nextAvailableSlot: { boardId: number; positionName: keyof Board } | undefined;
    
    // Definir las posiciones disponibles
    const positions = [
      "idDefender1", "idDefender2", "idDefender3", "idDefender4",
      "idDefender5", "idDefender6", "idDefender7", "idDefender8"
    ] as const;

    // Obtener todos los tableros activos del nivel
    const boards = await localQueryRunner.manager
      .createQueryBuilder(Board, "board")
      .where("board.idLevelId = :levelId", { levelId: currentBoard.idLevelId })
      .andWhere("board.idBoardState = 1")
      .orderBy("board.createAt", "ASC")
      .getMany();

    // Buscar la primera posición disponible en cualquier tablero
    let found = false;
    for (const board of boards) {
      for (const pos of positions) {
        if (board[pos] === null) {
          nextAvailableSlot = {
            boardId: board.id,
            positionName: pos as keyof Board
          };
          found = true;
          console.log(`[Service - assignPlayerService] Asignando usuario ${playerData.username} a tablero ${board.id} en posición ${pos}`);
          break;
        }
      }
      if (found) break;
    }

    if (!nextAvailableSlot) {
      throw new Error("No hay posiciones disponibles en ningún tablero del nivel.");
    }

    const targetBoard = await localQueryRunner.manager.findOne(Board, {
      where: { id: nextAvailableSlot.boardId }
    });

    if (!targetBoard) {
      throw new Error(`No se encontró el tablero ${nextAvailableSlot.boardId}`);
    }

    // Asignar el usuario al tablero
    await modifyAssosiationsOfUser(
      playerData.id,
      nextAvailableSlot.positionName,
      targetBoard,
      localQueryRunner
    );

    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
    }

    return {
      message: `Usuario ${playerData.username} asignado exitosamente al tablero ${nextAvailableSlot.boardId}`,
      status: 200,
    };

  } catch (error: any) {
    if (shouldReleaseQueryRunner && localQueryRunner.isTransactionActive) {
      await localQueryRunner.rollbackTransaction();
    }
    console.error("[Service - assignPlayerService] Error:", error);
    return {
      message: error.message || "Error al asignar usuario",
      status: 500,
    };
  } finally {
    if (shouldReleaseQueryRunner && localQueryRunner && !localQueryRunner.isReleased) {
      await localQueryRunner.release();
    }
  }
};

export const updatePlayerService = async (
  playerUsername: string,
  newPlayerData: FormUpdatePlayer,
  queryRunner?: QueryRunner
): Promise<void | ServiceResponse> => {
  let shouldReleaseQueryRunner = false;

  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    shouldReleaseQueryRunner = true;
  }

  try {
    //Find player
    const player = await readUserByUsername(queryRunner, playerUsername);

    if (!player) {
      throw new Error(`Jugador ${playerUsername} no encontrado.`);
    }

    //Capture password
    let password = newPlayerData.password;
    if (!!newPlayerData.password) {
      password = await encrypt(newPlayerData.password);
    } else {
      password = player.password;
    }

    const updatePayload: QueryDeepPartialEntity<EntityUser> = {
      firstName: newPlayerData.firstName,
      lastName: newPlayerData.lastName,
      country: newPlayerData.country,
      countryCode: newPlayerData.countryCode,
      phoneNumber: newPlayerData.phoneNumber,
      username: newPlayerData.username,
      acceptMarketing: newPlayerData.acceptMarketing,
      password,
    };

    if (newPlayerData.beneficiatedNames !== undefined) {
      updatePayload.beneficiatedNames = newPlayerData.beneficiatedNames ? [newPlayerData.beneficiatedNames] : null;
    }
    if (newPlayerData.beneficiatedPhoneNumber !== undefined) {
      updatePayload.beneficiatedPhoneNumber = newPlayerData.beneficiatedPhoneNumber ? [newPlayerData.beneficiatedPhoneNumber] : null;
    }
    if (newPlayerData.beneficiatedCountry !== undefined) {
      updatePayload.beneficiatedCountry = newPlayerData.beneficiatedCountry ? [newPlayerData.beneficiatedCountry] : null;
    }
    if (newPlayerData.beneficiatedCountryCode !== undefined) {
      updatePayload.beneficiatedCountryCode = newPlayerData.beneficiatedCountryCode ? [newPlayerData.beneficiatedCountryCode] : null;
    }

    //Update player
    await queryRunner.manager.update(
      EntityUser,
      { username: playerUsername },
      updatePayload
    );

    //Save changes if It's a principal function
    if (shouldReleaseQueryRunner) {
      await queryRunner.commitTransaction();
      return {
        message: `Jugador ${playerUsername} se ha actualizado correctamente.`,
        status: 200,
      };
    }
  } catch (error) {
    if (shouldReleaseQueryRunner) {
      await queryRunner.rollbackTransaction();
    }

    throw new Error(`${error}`);
  } finally {
    if (shouldReleaseQueryRunner) {
      await queryRunner.release();
    }
  }
};

export const searchStadiumAvailableOfGoalScorer = async (
  queryRunner: QueryRunner,
  goalScorerId: number
) => {
  try {
    const boardAvailable = await queryRunner.manager.findOne(Board, {
      where: {
        idLevelId: In([1]), // CORRECTED
        idBoardState: In([1]), // CORRECTED
        idGoalScorer: In([goalScorerId]),
      },
      loadRelationIds: true,
    });

    return boardAvailable;
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const massiveAssignPlayersService = async (
  changes: AssignPlayerRequest[]
): Promise<ServiceResponse> => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      for (let change of changes) {
        await assignPlayerService(
          change.goalScorerUsername,
          change.playerData,
          queryRunner
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: `Se han asignado los jugadores de manera exitosa.`,
        status: 200,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new Error(`${error}`);
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    return { message: `Se ha producido un error ${error}`, status: 500 };
  }
};

export const massiveUpdatePlayersService = async (
  changes: UpdatePlayerRequest[]
): Promise<ServiceResponse> => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      for (let change of changes) {
        await updatePlayerService(
          change.playerUsername,
          change.newPlayerData,
          queryRunner
        );
      }

      await queryRunner.commitTransaction();

      return {
        message: `Se han actualizado los jugadores de manera exitosa.`,
        status: 200,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new Error(`${error}`);
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    return { message: `Se ha producido un error ${error}`, status: 500 };
  }
};

export const verifyPlayerService = async (
  goalScorer: GetVerifyGoalScorerMock,
  defender: LoginUserData,
  board: GetVerifyBoardMock
): Promise<{ message: string }> => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let response: { message: string; status: number } = {} as any;

      switch (board.level) {
        case BoardLevel.OLÍMPICO:
          response = await playerVerify(
            goalScorer,
            defender,
            board,
            queryRunner
          );

          if (goalScorer.ballsReceived === 3) {
            await blockBoardService(board.id, queryRunner, 1);
          }

          break;

        case BoardLevel.CENTENARIO:
          response = await playerVerify(
            goalScorer,
            defender,
            board,
            queryRunner
          );

          if (goalScorer.ballsReceived === 1) {
            await blockBoardService(board.id, queryRunner, 1);
          } else if (goalScorer.ballsReceived === 3) {
            await blockBoardService(board.id, queryRunner, 2);
          } else if (goalScorer.ballsReceived === 5 || goalScorer.ballsReceived === 6) {
            await blockBoardService(board.id, queryRunner, 3);
          }

          break;

        case BoardLevel.AZTECA:
          response = await playerVerify(
            goalScorer,
            defender,
            board,
            queryRunner
          );

          break;

        default:
          throw new Error("Error, no está habilitado el nivel.");
      }

      //Save changes
      await queryRunner.commitTransaction();

      return {
        message: response.message,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new Error(`${error}`);
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const blockBoardService = async (
  boardId: number,
  queryRunner?: QueryRunner,
  blockadeStage: number = 1 // Add default blockade stage parameter
) => {
  // Flag for manage the connection if query runner is sended.
  let shouldReleaseQueryRunner = false;

  // If query runner isn´t sended...
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    shouldReleaseQueryRunner = true;
  }

  try {
    // Update board to state block and set the blockade stage
    await queryRunner.manager.update(
      Board,
      { id: boardId },
      { 
        idBoardState: 3, // BLOCKED
        currentBlockadeStage: blockadeStage // Add currentBlockadeStage update
      }
    );

    console.log(`[Service - blockBoardService] Tablero ${boardId} actualizado con idBoardState=3 (BLOCKED) y currentBlockadeStage=${blockadeStage}`);

    //Save changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.commitTransaction();
    }

    return {
      message: `Se bloqueó el campo de juego en etapa ${blockadeStage}.`,
      status: 200,
    };
  } catch (error) {
    // Rollback changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.rollbackTransaction();
    }

    throw new Error(`${error}`);
  } finally {
    // Release connection if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.release();
    }
  }
};

export const getVerifyAndBlockBoardService = async (
  goalScorer: any,
  defender: any,
  board: any
) => {
  try {
    const queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      // TODO:Update number of balls received of goal scorer
      queryRunner.manager.update(
        EntityUser,
        { username: goalScorer.username },
        { ballsReceived: goalScorer.ballsReceived + 1 }
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();

      throw new Error(`${error}`);
    } finally {
      await queryRunner.release();
    }
  } catch (error) {}
};

export const validatePlayer = async (
  playerId: number,
  queryRunner?: QueryRunner
) => {
  await updatePlayerById(playerId, { idUserProcessState: 4 });
};

export const updatePlayerById = async (
  playerId: number,
  playerUpdate: QueryDeepPartialEntity<EntityUser>,
  queryRunner?: QueryRunner
) => {
  // Flag for manage the connection if query runner is sended.
  let shouldReleaseQueryRunner = false;

  // If query runner isn´t sended...
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    shouldReleaseQueryRunner = true;
  }

  try {
    // Update board to state block.
    await queryRunner.manager.update(
      EntityUser,
      { id: In([playerId]) },
      playerUpdate
    );

    //Save changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.commitTransaction();
    }

    return {
      message: `Se actualizó el jugador.`,
      status: 200,
    };
  } catch (error) {
    // Rollback changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.rollbackTransaction();
    }

    throw new Error(`${error}`);
  } finally {
    // Release connection if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.release();
    }
  }
};

export const unlockBoardService = async (
  defender: LoginUserData,
  queryRunner?: QueryRunner
) => {
  let shouldReleaseQueryRunner = false;

  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    shouldReleaseQueryRunner = true;
  }

  try {
    // 1. Buscar el tablero bloqueado de Génesis donde el defensor es General
    const genesisBoard = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: defender.id,
        idLevelId: BoardLevelNumericId.GENESIS,
        idBoardState: BoardStateNumericId.BLOCKED // Estado 3 = Bloqueado
      }
    });

    if (!genesisBoard) {
      throw Error("No se encontró el tablero bloqueado de Génesis donde el recluta es General.");
    }

    // 2. Validar que el tablero está en una etapa de bloqueo válida (1 o 2)
    if (!genesisBoard.currentBlockadeStage || 
        genesisBoard.currentBlockadeStage > 2 || 
        genesisBoard.currentBlockadeStage < 1) {
      throw Error("El tablero no está en una etapa de bloqueo válida para ser desbloqueado (debe ser etapa 1 o 2).");
    }

    // 3. Validar que el tablero está efectivamente bloqueado
    if (genesisBoard.idBoardState !== BoardStateNumericId.BLOCKED) {
      throw Error("El tablero no está en estado bloqueado.");
    }

    // 4. Actualizar el estado del tablero a WAITING o PROCESS según corresponda
    const positionAvailable = getPositionAvailable(genesisBoard);

    const newBoardState = positionAvailable?.includes("Defender") 
      ? BoardStateNumericId.WAITING  // Estado 1
      : BoardStateNumericId.PROCESS; // Estado 2

    // 5. Actualizar el tablero
    await queryRunner.manager.update(
      Board,
      { id: genesisBoard.id },
      { 
        idBoardState: newBoardState,
        currentBlockadeStage: null // Resetear la etapa de bloqueo
      }
    );

    // Commit transaction if we started it
    if (shouldReleaseQueryRunner) {
      await queryRunner.commitTransaction();
    }

    return {
      message: `Se desbloqueó el campo de juego de Génesis (etapa ${genesisBoard.currentBlockadeStage}).`,
      status: 200,
    };
  } catch (error) {
    if (shouldReleaseQueryRunner) {
      await queryRunner.rollbackTransaction();
    }
    throw new Error(`${error}`);
  } finally {
    if (shouldReleaseQueryRunner) {
      await queryRunner.release();
    }
  }
};

export const subscribeToNextLevelService = async (
  board: GetVerifyBoardMock,
  goalScorer: LoginUserData,
  queryRunner?: QueryRunner
): Promise<{ message: string; status: number; nextBoard?: Board }> => {
  // Flag for manage the connection if query runner is sended.
  let shouldReleaseQueryRunner = false;

  // If query runner isn´t sended...
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    shouldReleaseQueryRunner = true;
  }

  try {
    // Find next level
    const level =
      board.level === BoardLevel.OLÍMPICO
        ? 2
        : board.level === BoardLevel.CENTENARIO
        ? 3
        : null;

    if (!level)
      throw new Error("No existe un nivel superior en campos de juego.");

    // Search board available for goal scorer.
    const boardFound = await queryRunner.manager.findOne(Board, {
      where: {
        idBoardState: In([1]), // MODIFIED
        idLevelId: In([level]), // CORRECTED
      },
      loadRelationIds: true,
    });

    if (!boardFound) {
      throw Error("No se encontró el campo de juego del defensa.");
    }

    const positionsAvailables = getPositionsAvailables(boardFound);

    if (!positionsAvailables)
      throw Error(
        "No se encontró una posición dispónible en el campo de juego."
      );

    if (!positionsAvailables[0].includes("Defender"))
      throw new Error("No se encontró una posición adecuada para el jugador.");

    // Subscribe player
    const boardUpdate: QueryDeepPartialEntity<Board> = {
      [positionsAvailables[0]]: goalScorer.id,
    };

    // Change state of board, if is the last player position
    if (positionsAvailables.length === 1) {
      boardUpdate.idBoardState = 2; // MODIFIED
    }

    await queryRunner.manager.update(Board, { id: boardFound.id }, boardUpdate);

    //Save changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.commitTransaction();
    }

    // Fetch the updated board to return it
    const updatedNextBoard = await queryRunner.manager.findOne(Board, {
      where: { id: boardFound.id },
      relations: [
        "idGoalScorer",
        "idCreator1",
        "idCreator2",
        "idGenerator1",
        "idGenerator2",
        "idGenerator3",
        "idGenerator4",
        "idDefender1",
        "idDefender2",
        "idDefender3",
        "idDefender4",
        "idDefender5",
        "idDefender6",
        "idDefender7",
        "idDefender8",
        "idLevel",
        "idBoardState",
      ],
    });

    return {
      message: "Envía tu balón en el siguiente nivel para continuar.",
      status: 200,
      nextBoard: updatedNextBoard || undefined, // Return the board found/updated
    };
  } catch (error) {
    // Rollback changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.rollbackTransaction();
    }

    throw new Error(`${error}`);
  } finally {
    // Release connection if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.release();
    }
  }
};

export const closeBoardService = async (
  board: GetVerifyBoardMock,
  queryRunner?: QueryRunner
) => {
  // Flag for manage the connection if query runner is sended.
  let shouldReleaseQueryRunner = false;

  // If query runner isn´t sended...
  if (!queryRunner) {
    queryRunner = AppDataSource.createQueryRunner();

    await queryRunner.connect();

    await queryRunner.startTransaction();

    shouldReleaseQueryRunner = true;
  }

  try {
    const levelIdNumeric =
      board.level === BoardLevel.OLÍMPICO
        ? 1
        : board.level === BoardLevel.CENTENARIO
        ? 2
        : board.level === BoardLevel.AZTECA
        ? 3
        : null;

    if (!levelIdNumeric) throw new Error("El nivel del campo de juego (board.level) no es válido para esta operación.");

    const newBoard1 = queryRunner.manager.create(Board, {
      idLevelId: levelIdNumeric === null ? undefined : levelIdNumeric, // CORRECTED: null vs undefined
      idBoardState: 1, // MODIFIED
      idGoalScorer: board.creator1.id, // Assign ID
      idCreator1: board.generator1.id, // Assign ID
      idCreator2: board.generator2.id,
      idGenerator1: board.defender1.id,
      idGenerator2: board.defender2.id,
      idGenerator3: board.defender3.id,
      idGenerator4: board.defender4.id,
    });

    const newBoard2 = queryRunner.manager.create(Board, {
      idLevelId: levelIdNumeric === null ? undefined : levelIdNumeric, // CORRECTED: null vs undefined
      idBoardState: 1, // MODIFIED
      idGoalScorer: board.creator2.id, // Assign ID
      idCreator1: board.generator3.id, // Assign ID
      idCreator2: board.generator4.id,
      idGenerator1: board.defender5.id,
      idGenerator2: board.defender6.id,
      idGenerator3: board.defender7.id,
      idGenerator4: board.defender8.id,
    });

    if (board.level === BoardLevel.OLÍMPICO) {
      const usersInTail = await getUserTailToInsertOnNewBoard();
      const group1 = usersInTail[0];
      const group2 = usersInTail[1];
      if (group1?.length > 0) {
        group1.forEach(async (userOnTail) => {
          const positionAvailable = getPositionAvailable(newBoard1 as any); // Cast needed if getPositionAvailable expects entity
          if (positionAvailable) {
            const userOnTailData = getUserDataInfo(userOnTail);
            (newBoard1 as any)[positionAvailable] = userOnTailData.id; // CORRECTED: Assign ID (use 'as any' to bypass type check temporarily if needed)
            if (positionAvailable === "idDefender8") {
              newBoard1.idBoardState = 2; // MODIFIED
            }
            await eraseUserTailByIdTail(userOnTail.id);
            await modifyUserById(userOnTailData.id, {
              idCaptain: newBoard1.idGoalScorer === null ? undefined : newBoard1.idGoalScorer, // CORRECTED
              idUserProcessState: 2,
            });
            await modifyAssosiationsOfUser(
              userOnTailData.id,
              positionAvailable,
              newBoard1,
              queryRunner! // ADDED ! for non-null assertion
            );
            await notificateGotOutTail(userOnTailData);
            await notificatePushGotOutTail(userOnTailData);
          }
        });
      }

      if (group2?.length > 0) {
        group2.forEach(async (userOnTail) => {
          const positionAvailable = getPositionAvailable(newBoard2 as any); // Cast needed if getPositionAvailable expects entity
          if (positionAvailable) {
            const userOnTailData = getUserDataInfo(userOnTail);
            (newBoard2 as any)[positionAvailable] = userOnTailData.id; // CORRECTED: Assign ID (use 'as any' to bypass type check temporarily if needed)
            if (positionAvailable === "idDefender8") {
              newBoard2.idBoardState = 2; // MODIFIED
            }
            await eraseUserTailByIdTail(userOnTail.id);
            await modifyUserById(userOnTailData.id, {
              idCaptain: newBoard2.idGoalScorer === null ? undefined : newBoard2.idGoalScorer, // CORRECTED
              idUserProcessState: 2,
            });
            await modifyAssosiationsOfUser(
              userOnTailData.id,
              positionAvailable,
              newBoard2,
              queryRunner! // ADDED ! for non-null assertion
            );
            await notificateGotOutTail(userOnTailData);
            await notificatePushGotOutTail(userOnTailData);
          }
        });
      }
    }

    await queryRunner.manager.update(
      EntityUser,
      { username: board.creator1.username },
      { idUserProcessState: 1 }
    );

    await queryRunner.manager.update(
      EntityUser,
      { username: board.creator2.username },
      { idUserProcessState: 1 }
    );

    await queryRunner.manager.update(
      Board,
      { id: board.id },
      { idBoardState: 4 } // MODIFIED
    );

    await queryRunner.manager.save(newBoard1);
    await queryRunner.manager.save(newBoard2);

    //Save changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.commitTransaction();
    }

    return {
      message: `Se cerró el campo de juego.`,
      status: 200,
    };
  } catch (error) {
    // Rollback changes if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.rollbackTransaction();
    }

    throw new Error(`${error}`);
  } finally {
    // Release connection if...
    if (shouldReleaseQueryRunner) {
      await queryRunner.release();
    }
  }
};

// Helper function to manage board splitting and promote remaining players
// RENAMED and ADDED levelId parameter
export const splitBoardAndPromotePlayers = async (
  originalBoard: Board, // Expecting the full Board entity
  levelId: number, // <<< ADDED: The ID of the level being split
  queryRunner: QueryRunner
): Promise<{ splitBoardA_Id?: number; splitBoardB_Id?: number }> => {
  console.log(`[Service - splitBoardAndPromotePlayers] Initiating split for board ID: ${originalBoard.id} at Level: ${levelId}`); // MODIFIED Log

  const originalBoardId = originalBoard.id;

  // Log all player assignments for debugging
  console.log(`[Service - splitBoardAndPromotePlayers] Original board player assignments:
    GoalScorer: ${originalBoard.idGoalScorer || 'null'},
    Creator1: ${originalBoard.idCreator1 || 'null'}, 
    Creator2: ${originalBoard.idCreator2 || 'null'}, 
    Generator1: ${originalBoard.idGenerator1 || 'null'}, 
    Generator2: ${originalBoard.idGenerator2 || 'null'}, 
    Generator3: ${originalBoard.idGenerator3 || 'null'}, 
    Generator4: ${originalBoard.idGenerator4 || 'null'},
    Defender1: ${originalBoard.idDefender1 || 'null'}, 
    Defender2: ${originalBoard.idDefender2 || 'null'}, 
    Defender3: ${originalBoard.idDefender3 || 'null'}, 
    Defender4: ${originalBoard.idDefender4 || 'null'}, 
    Defender5: ${originalBoard.idDefender5 || 'null'}, 
    Defender6: ${originalBoard.idDefender6 || 'null'}, 
    Defender7: ${originalBoard.idDefender7 || 'null'}, 
    Defender8: ${originalBoard.idDefender8 || 'null'}`);

  // Destructure player IDs from the original board entity
  const {
    idCreator1: originalCreator1Id,
    idCreator2: originalCreator2Id,
    idGenerator1: originalGenerator1Id,
    idGenerator2: originalGenerator2Id,
    idGenerator3: originalGenerator3Id,
    idGenerator4: originalGenerator4Id,
    idDefender1: originalDefender1Id,
    idDefender2: originalDefender2Id,
    idDefender3: originalDefender3Id,
    idDefender4: originalDefender4Id,
    idDefender5: originalDefender5Id,
    idDefender6: originalDefender6Id,
    idDefender7: originalDefender7Id,
    idDefender8: originalDefender8Id,
  } = originalBoard;

  // Create new Board A (Left Side)
  const newBoardAEntity = queryRunner.manager.create(Board, {
    idLevelId: levelId, // <<< MODIFIED: Use the passed levelId
    idBoardState: 1, // WaitingForPlayers
    idGoalScorer: originalCreator1Id || null,    // Promoted Commander (now General)
    idCreator1: originalGenerator1Id || null,    // Promoted Sergeant (now Commander)
    idCreator2: originalGenerator2Id || null,    // Promoted Sergeant (now Commander)
    idGenerator1: originalDefender1Id || null,   // Promoted Recruit (now Sergeant)
    idGenerator2: originalDefender2Id || null,   // Promoted Recruit (now Sergeant)
    idGenerator3: originalDefender3Id || null,   // Promoted Recruit (now Sergeant)
    idGenerator4: originalDefender4Id || null,   // Promoted Recruit (now Sergeant)
    // Defender positions (new Recruits) are initially null
    idDefender1: null,
    idDefender2: null,
    idDefender3: null,
    idDefender4: null,
    idDefender5: null,
    idDefender6: null,
    idDefender7: null,
    idDefender8: null,
  });
  const savedNewBoardA = await queryRunner.manager.save(Board, newBoardAEntity);
  console.log(`[Service - splitBoardAndPromotePlayers] Created new board A (ID: ${savedNewBoardA.id}) at Level ${levelId}`); // MODIFIED Log

  // <<< START: Setup Dual Role for new General of Board A >>>
  if (originalCreator1Id) {
    // Check if the general is an admin user
    const general = await queryRunner.manager.findOne(EntityUser, { where: { id: originalCreator1Id } });
    const isAdminUser = general && general.idRole === 1;
    
    console.log(`[Service - splitBoardAndPromotePlayers] General A Check: userId=${general?.id}, isAdminUser=${isAdminUser}`);
    
    if (!isAdminUser) {
      console.log(`[Service - splitBoardAndPromotePlayers] Setting up dual role for non-admin General ${originalCreator1Id}.`);
    await setupPotentialDualRoleForGeneralService(originalCreator1Id, savedNewBoardA.id, levelId, queryRunner);
    console.log(`[Service - splitBoardAndPromotePlayers] Called setupPotentialDualRole for new General ${originalCreator1Id} of Board A ${savedNewBoardA.id}`);
    } else {
      console.log(`[Service - splitBoardAndPromotePlayers] Skipping dual role setup for admin user ${originalCreator1Id}.`);
    }
  }
  // <<< END: Setup Dual Role for new General of Board A >>>

  // Create new Board B (Right Side)
  const newBoardBEntity = queryRunner.manager.create(Board, {
    idLevelId: levelId, // <<< MODIFIED: Use the passed levelId
    idBoardState: 1, // WaitingForPlayers
    idGoalScorer: originalCreator2Id || null,    // Promoted Commander (now General)
    idCreator1: originalGenerator3Id || null,    // Promoted Sergeant (now Commander)
    idCreator2: originalGenerator4Id || null,    // Promoted Sergeant (now Commander)
    idGenerator1: originalDefender5Id || null,   // Promoted Recruit (now Sergeant)
    idGenerator2: originalDefender6Id || null,   // Promoted Recruit (now Sergeant)
    idGenerator3: originalDefender7Id || null,   // Promoted Recruit (now Sergeant)
    idGenerator4: originalDefender8Id || null,   // Promoted Recruit (now Sergeant)
    // Defender positions (new Recruits) are initially null
    idDefender1: null,
    idDefender2: null,
    idDefender3: null,
    idDefender4: null,
    idDefender5: null,
    idDefender6: null,
    idDefender7: null,
    idDefender8: null,
  });
  const savedNewBoardB = await queryRunner.manager.save(Board, newBoardBEntity);
  console.log(`[Service - splitBoardAndPromotePlayers] Created new board B (ID: ${savedNewBoardB.id}) at Level ${levelId}`); // MODIFIED Log

  // <<< START: Setup Dual Role for new General of Board B >>>
  if (originalCreator2Id) {
    // Check if the general is an admin user
    const general = await queryRunner.manager.findOne(EntityUser, { where: { id: originalCreator2Id } });
    const isAdminUser = general && general.idRole === 1;
    
    console.log(`[Service - splitBoardAndPromotePlayers] General B Check: userId=${general?.id}, isAdminUser=${isAdminUser}`);
    
    if (!isAdminUser) {
      console.log(`[Service - splitBoardAndPromotePlayers] Setting up dual role for non-admin General ${originalCreator2Id}.`);
    await setupPotentialDualRoleForGeneralService(originalCreator2Id, savedNewBoardB.id, levelId, queryRunner);
    console.log(`[Service - splitBoardAndPromotePlayers] Called setupPotentialDualRole for new General ${originalCreator2Id} of Board B ${savedNewBoardB.id}`);
    } else {
      console.log(`[Service - splitBoardAndPromotePlayers] Skipping dual role setup for admin user ${originalCreator2Id}.`);
    }
  }
  // <<< END: Setup Dual Role for new General of Board B >>>

  // Update subscriptions and user states for players moving to Board A
  const playersForBoardA = [
    { id: originalCreator1Id, newRole: 'GoalScorer' },
    { id: originalGenerator1Id, newRole: 'Creator' }, { id: originalGenerator2Id, newRole: 'Creator' },
    { id: originalDefender1Id, newRole: 'Generator' }, { id: originalDefender2Id, newRole: 'Generator' },
    { id: originalDefender3Id, newRole: 'Generator' }, { id: originalDefender4Id, newRole: 'Generator' },
  ];
  
  console.log(`[Service - splitBoardAndPromotePlayers] Moving players to Board A: ${JSON.stringify(playersForBoardA.map(p => p.id))}`);
  
  for (const player of playersForBoardA) {
    if (player.id) {
      // ✅ NUEVA LÓGICA: Verificar si el jugador tiene rol dual en este tablero y actualizar su posición secundaria
      const userData = await queryRunner.manager.findOne(EntityUser, { where: { id: player.id } });
      if (userData && 
          userData.secondaryBoardIdAsRecruit === originalBoardId && 
          userData.secondaryBoardLevelIdAsRecruit === levelId) {
          
          // Determinar la nueva posición basada en el rol
          let newPosition: string;
          switch (player.newRole) {
            case 'GoalScorer': newPosition = 'idGoalScorer'; break;
            case 'Creator': 
              newPosition = userData.id === originalGenerator1Id ? 'idCreator1' : 'idCreator2'; 
              break;
            case 'Generator':
              if (userData.id === originalDefender1Id) newPosition = 'idGenerator1';
              else if (userData.id === originalDefender2Id) newPosition = 'idGenerator2';
              else if (userData.id === originalDefender3Id) newPosition = 'idGenerator3';
              else newPosition = 'idGenerator4';
              break;
            default: newPosition = userData.secondaryPositionAsRecruit || 'idDefender1'; // Mantener posición actual o fallback
          }
          
          console.log(`[Service - splitBoardAndPromotePlayers] DUAL ROLE UPDATE: Player ${player.id} moving to Board A. Updating secondary position from '${userData.secondaryPositionAsRecruit}' to '${newPosition}' on board ${savedNewBoardA.id}`);
          
          // Actualizar la posición secundaria y el tablero
          await queryRunner.manager.update(EntityUser, player.id, { 
            secondaryBoardIdAsRecruit: savedNewBoardA.id,
            secondaryPositionAsRecruit: newPosition 
          });
      }
      
      // Todos los jugadores deben ser asignados al nuevo tablero
      await queryRunner.manager.update(Subscription,
        { idUser: player.id, idBoard: originalBoardId },
        { idBoard: savedNewBoardA.id, idSubscriptionState: 1 } // Ensure active subscription
      );
      if (player.newRole === 'GoalScorer') { // Update UserProcessState for new Generals
        await queryRunner.manager.update(EntityUser, { id: player.id }, { idUserProcessState: 1 }); // Active state
      } else if (player.id) { // For other promoted players (Creators, Generators)
        await queryRunner.manager.update(EntityUser, { id: player.id }, { idUserProcessState: 1 }); // Set to Active state
        console.log(`[Service - splitBoardAndPromotePlayers] Player ${player.id} (new role: ${player.newRole}) state set to ACTIVE (1) in board A.`);
      }
      console.log(`[Service - splitBoardAndPromotePlayers] Updated subscription for user ${player.id} to board A (${savedNewBoardA.id})`); // MODIFIED Log
    }
  }

  // Update subscriptions and user states for players moving to Board B
  const playersForBoardB = [
    { id: originalCreator2Id, newRole: 'GoalScorer' },
    { id: originalGenerator3Id, newRole: 'Creator' }, { id: originalGenerator4Id, newRole: 'Creator' },
    { id: originalDefender5Id, newRole: 'Generator' }, { id: originalDefender6Id, newRole: 'Generator' },
    { id: originalDefender7Id, newRole: 'Generator' }, { id: originalDefender8Id, newRole: 'Generator' },
  ];
  
  console.log(`[Service - splitBoardAndPromotePlayers] Moving players to Board B: ${JSON.stringify(playersForBoardB.map(p => p.id))}`);
  
  for (const player of playersForBoardB) {
    if (player.id) {
      // ✅ NUEVA LÓGICA: Verificar si el jugador tiene rol dual en este tablero y actualizar su posición secundaria
      const userData = await queryRunner.manager.findOne(EntityUser, { where: { id: player.id } });
      if (userData && 
          userData.secondaryBoardIdAsRecruit === originalBoardId && 
          userData.secondaryBoardLevelIdAsRecruit === levelId) {
          
          // Determinar la nueva posición basada en el rol
          let newPosition: string;
          switch (player.newRole) {
            case 'GoalScorer': newPosition = 'idGoalScorer'; break;
            case 'Creator': 
              newPosition = userData.id === originalGenerator3Id ? 'idCreator1' : 'idCreator2'; 
              break;
            case 'Generator':
              if (userData.id === originalDefender5Id) newPosition = 'idGenerator1';
              else if (userData.id === originalDefender6Id) newPosition = 'idGenerator2';
              else if (userData.id === originalDefender7Id) newPosition = 'idGenerator3';
              else newPosition = 'idGenerator4';
              break;
            default: newPosition = userData.secondaryPositionAsRecruit || 'idDefender1'; // Mantener posición actual o fallback
          }
          
          console.log(`[Service - splitBoardAndPromotePlayers] DUAL ROLE UPDATE: Player ${player.id} moving to Board B. Updating secondary position from '${userData.secondaryPositionAsRecruit}' to '${newPosition}' on board ${savedNewBoardB.id}`);
          
          // Actualizar la posición secundaria y el tablero
          await queryRunner.manager.update(EntityUser, player.id, { 
            secondaryBoardIdAsRecruit: savedNewBoardB.id,
            secondaryPositionAsRecruit: newPosition 
          });
      }
      
      // Todos los jugadores deben ser asignados al nuevo tablero
      await queryRunner.manager.update(Subscription,
        { idUser: player.id, idBoard: originalBoardId },
        { idBoard: savedNewBoardB.id, idSubscriptionState: 1 } // Ensure active subscription
      );
      if (player.newRole === 'GoalScorer') { // Update UserProcessState for new Generals
        await queryRunner.manager.update(EntityUser, { id: player.id }, { idUserProcessState: 1 }); // Active state
      } else if (player.id) { // For other promoted players (Creators, Generators)
        await queryRunner.manager.update(EntityUser, { id: player.id }, { idUserProcessState: 1 }); // Set to Active state
        console.log(`[Service - splitBoardAndPromotePlayers] Player ${player.id} (new role: ${player.newRole}) state set to ACTIVE (1) in board B.`);
      }
      console.log(`[Service - splitBoardAndPromotePlayers] Updated subscription for user ${player.id} to board B (${savedNewBoardB.id})`); // MODIFIED Log
    }
  }
  
  // Mark original board as closed and clear all player positions
  await queryRunner.manager.update(Board, originalBoardId, {
    idBoardState: 2, // State for "Closed" or "Split" (Corrected to InActivo ID)
    idGoalScorer: null,
    idCreator1: null,
    idCreator2: null,
    idGenerator1: null,
    idGenerator2: null,
    idGenerator3: null,
    idGenerator4: null,
    idDefender1: null,
    idDefender2: null,
    idDefender3: null,
    idDefender4: null,
    idDefender5: null,
    idDefender6: null,
    idDefender7: null,
    idDefender8: null,
  });
  console.log(`[Service - splitBoardAndPromotePlayers] Original board ID: ${originalBoardId} marked as closed and player positions cleared.`); // MODIFIED Log

  // --- NUEVO: Lógica condicional para llenar posiciones de Defender ---
  const defenderPositions: (keyof Board)[] = [
    'idDefender1', 'idDefender2', 'idDefender3', 'idDefender4',
    'idDefender5', 'idDefender6', 'idDefender7', 'idDefender8'
  ];

  if (levelId === 1) {
    // Nivel 1 (Génesis): Llenar desde la cola (tail)
    console.log(`[Service - splitBoardAndPromotePlayers] Level 1 split. Filling defenders from tail for boards ${savedNewBoardA.id} and ${savedNewBoardB.id}.`);
    const tailUsers = await queryRunner.manager
      .createQueryBuilder(EntityUser, 'user')
      .innerJoin('tail', 't', 't.idUser = user.id')
      .orderBy('t.createAt', 'ASC')
      .getMany();

    let tailIndex = 0;
    // Asignar a Board A desde la cola
    for (const pos of defenderPositions) {
      if (tailIndex >= tailUsers.length) break;
      const boardA = await queryRunner.manager.findOne(Board, { where: { id: savedNewBoardA.id } });
      if (boardA && (boardA as any)[pos] === null) {
        const user = tailUsers[tailIndex];
        console.log(`[Service - splitBoardAndPromotePlayers] Assigning tail user ${user.id} to ${pos} on board A (${savedNewBoardA.id})`);
        await queryRunner.manager.update(Board, savedNewBoardA.id, { [pos]: user.id });
        await queryRunner.manager.update(EntityUser, { id: user.id }, { idUserProcessState: 2 }); // Recluta
        await queryRunner.manager.insert(Subscription, { // Create subscription
          idUser: user.id,
          idBoard: savedNewBoardA.id,
          idSubscriptionState: 1 // Active
        }).catch(async () => { // If insert fails (e.g., user already has a subscription row), update it
            console.warn(`[Service - splitBoardAndPromotePlayers] Insert subscription failed for user ${user.id}, attempting update.`);
            await queryRunner.manager.update(Subscription, { idUser: user.id }, { idBoard: savedNewBoardA.id, idSubscriptionState: 1 });
        });
        await queryRunner.manager.delete('tail', { idUser: user.id });
        tailIndex++;
      }
    }
    // Asignar a Board B desde la cola
    for (const pos of defenderPositions) {
      if (tailIndex >= tailUsers.length) break;
      const boardB = await queryRunner.manager.findOne(Board, { where: { id: savedNewBoardB.id } });
      if (boardB && (boardB as any)[pos] === null) {
        const user = tailUsers[tailIndex];
        console.log(`[Service - splitBoardAndPromotePlayers] Assigning tail user ${user.id} to ${pos} on board B (${savedNewBoardB.id})`);
        await queryRunner.manager.update(Board, savedNewBoardB.id, { [pos]: user.id });
        await queryRunner.manager.update(EntityUser, { id: user.id }, { idUserProcessState: 2 }); // Recluta
        await queryRunner.manager.insert(Subscription, { // Create subscription
            idUser: user.id,
            idBoard: savedNewBoardB.id,
            idSubscriptionState: 1 // Active
        }).catch(async () => { // If insert fails (e.g., user already has a subscription row), update it
            console.warn(`[Service - splitBoardAndPromotePlayers] Insert subscription failed for user ${user.id}, attempting update.`);
            await queryRunner.manager.update(Subscription, { idUser: user.id }, { idBoard: savedNewBoardB.id, idSubscriptionState: 1 });
        });
        await queryRunner.manager.delete('tail', { idUser: user.id });
        tailIndex++;
      }
    }
  } else {
    // Nivel > 1: Llenar desde GoalScorers promovidos del nivel anterior
    const previousLevelId = levelId - 1;
    console.log(`[Service - splitBoardAndPromotePlayers] Level ${levelId} split. Filling defenders from promoted GoalScorers of Level ${previousLevelId}.`);

    // 1. Find GoalScorers from previous level ready for promotion (State VALIDATED = 4)
    // First, find boards at the previous level that have a GoalScorer.
    const boardsAtPreviousLevel = await queryRunner.manager.find(Board, {
        where: { 
            idLevelId: previousLevelId,
            idGoalScorer: Not(IsNull()) // <<< CHANGED: Use Not(IsNull()) instead of Not(null)
        },
        select: ["id", "idGoalScorer"] // Select only necessary fields
    });

    // Get the IDs of these GoalScorers
    const goalScorerIdsFromPrevLevel = boardsAtPreviousLevel
        .map(b => b.idGoalScorer)
        .filter((id): id is number => id !== null); // Filter out any nulls just in case

    let promotableGoalScorers: EntityUser[] = [];
    if (goalScorerIdsFromPrevLevel.length > 0) {
        // Now, find the actual User entities for these IDs who are in the VALIDATED state (4)
        promotableGoalScorers = await queryRunner.manager.find(EntityUser, {
            where: {
                id: In(goalScorerIdsFromPrevLevel),
                idUserProcessState: 4 // State: VALIDATED (ready to promote)
            },
            order: {
                updateAt: "ASC" // Promote oldest validated first for fairness
            }
        });
    }
    
    console.log(`[Service - splitBoardAndPromotePlayers] Found ${promotableGoalScorers.length} promotable GoalScorers from Level ${previousLevelId}.`);

    let promotedIndex = 0;
    // --- INICIO CAMBIO: Controlar duplicados de reclutas ---
    const assignedUserIds = new Set<number>();

    // Mueve aquí la función assignPromotedUser para que tenga acceso a las variables:
    const assignPromotedUser = async (user: EntityUser, boardId: number, position: keyof Board) => {
        const isAdminUser = user.idRole === 1;
        if (isAdminUser) {
            const originalBoard = boardsAtPreviousLevel.find(b => b.idGoalScorer === user.id);
            if (originalBoard) {
                await queryRunner.manager.update(Board, originalBoard.id, { idGoalScorer: null });
            }
            await queryRunner.manager.update(EntityUser, user.id, { 
                idUserProcessState: 4, // VALIDATED
                canVerifyRecruits: true,
                secondaryBoardIdAsRecruit: null,
                secondaryBoardLevelIdAsRecruit: null,
                secondaryPositionAsRecruit: null
            });
            return;
        }
        const originalBoard = boardsAtPreviousLevel.find(b => b.idGoalScorer === user.id);
        await queryRunner.manager.update(Board, boardId, { [position]: user.id });
        await queryRunner.manager.update(EntityUser, user.id, { idUserProcessState: 2 });
        const userDataForSubscription = await queryRunner.manager.findOne(EntityUser, { where: { id: user.id } });
        if (userDataForSubscription && userDataForSubscription.secondaryBoardIdAsRecruit) {
            await queryRunner.manager.update(Subscription, { idUser: user.id, idBoard: userDataForSubscription.secondaryBoardIdAsRecruit }, { idBoard: boardId, idSubscriptionState: 1 });
        } else if (originalBoard) {
            await queryRunner.manager.update(Subscription, { idUser: user.id, idBoard: originalBoard.id }, { idBoard: boardId, idSubscriptionState: 1 });
        } else {
            await queryRunner.manager.update(Subscription, { idUser: user.id }, { idBoard: boardId, idSubscriptionState: 1 });
        }
        if (originalBoard) {
            await queryRunner.manager.update(Board, originalBoard.id, { idGoalScorer: null });
        }
        const currentUserData = await queryRunner.manager.findOne(EntityUser, { where: { id: user.id } });
        if (currentUserData && 
            currentUserData.secondaryBoardIdAsRecruit === boardId && 
            currentUserData.secondaryBoardLevelIdAsRecruit === levelId) {
            await queryRunner.manager.update(EntityUser, user.id, { 
                secondaryPositionAsRecruit: position as string 
            });
        }
    };

    // 2. Asignar GoalScorers promovidos a Defender slots en Board A
    for (const pos of defenderPositions) {
        if (promotedIndex >= promotableGoalScorers.length) break;
        const user = promotableGoalScorers[promotedIndex];
        if (assignedUserIds.has(user.id)) {
            promotedIndex++;
            continue; // Ya fue asignado
        }
        const boardA = await queryRunner.manager.findOne(Board, { where: { id: savedNewBoardA.id }});
        if (boardA && (boardA as any)[pos] === null) {
            await assignPromotedUser(user, savedNewBoardA.id, pos);
            assignedUserIds.add(user.id);
            promotedIndex++;
        }
    }
    // 3. Asignar GoalScorers restantes a Defender slots en Board B
    for (const pos of defenderPositions) {
        if (promotedIndex >= promotableGoalScorers.length) break;
        const user = promotableGoalScorers[promotedIndex];
        if (assignedUserIds.has(user.id)) {
            promotedIndex++;
            continue; // Ya fue asignado
        }
        const boardB = await queryRunner.manager.findOne(Board, { where: { id: savedNewBoardB.id }});
        if (boardB && (boardB as any)[pos] === null) {
            await assignPromotedUser(user, savedNewBoardB.id, pos);
            assignedUserIds.add(user.id);
            promotedIndex++;
        }
    }
    // --- FIN CAMBIO ---

    // 4. Handle excess GoalScorers: Add to tail
    if (promotedIndex < promotableGoalScorers.length) {
        const excessCount = promotableGoalScorers.length - promotedIndex;
        console.log(`[Service - splitBoardAndPromotePlayers] ${excessCount} promoted GoalScorers did not fit into new boards, adding to tail.`);
        for (let i = promotedIndex; i < promotableGoalScorers.length; i++) {
            const user = promotableGoalScorers[i];
            console.log(`[Service - splitBoardAndPromotePlayers] Adding promoted GS ${user.id} to tail.`);

            // Find the user's original board at previousLevelId
            const originalBoard = boardsAtPreviousLevel.find(b => b.idGoalScorer === user.id);

            // Update user state to WAITING_IN_TAIL (Assumed state 5)
            await queryRunner.manager.update(EntityUser, user.id, { idUserProcessState: 5 }); 

            // Set subscription to INACTIVE (Assumed state 2)
            // ✅ FIX: For dual-role users, update subscription from their CURRENT secondary board, not original board
            const userDataForTailSubscription = await queryRunner.manager.findOne(EntityUser, { where: { id: user.id } });
            
            if (userDataForTailSubscription && userDataForTailSubscription.secondaryBoardIdAsRecruit) {
                // This is a dual-role user - update subscription from their CURRENT secondary board
                console.log(`[Service - splitBoardAndPromotePlayers] DUAL USER TAIL: Setting subscription INACTIVE for current secondary board ${userDataForTailSubscription.secondaryBoardIdAsRecruit}`);
                await queryRunner.manager.update(Subscription, { idUser: user.id, idBoard: userDataForTailSubscription.secondaryBoardIdAsRecruit }, { idSubscriptionState: 2 });
            } else if (originalBoard) {
                // Regular user - update subscription from their original board
                console.log(`[Service - splitBoardAndPromotePlayers] REGULAR USER TAIL: Setting subscription INACTIVE for original board ${originalBoard.id}`);
                await queryRunner.manager.update(Subscription, { idUser: user.id, idBoard: originalBoard.id }, { idSubscriptionState: 2 });
            } else {
                // Fallback: if we can't identify the source board, update any subscription to this level
                console.log(`[Service - splitBoardAndPromotePlayers] FALLBACK TAIL: Setting any subscription INACTIVE`);
            await queryRunner.manager.update(Subscription, { idUser: user.id }, { idSubscriptionState: 2 }); 
            }

            // Clear user from GoalScorer spot on old board (level N-1)
            if (originalBoard) {
                await queryRunner.manager.update(Board, originalBoard.id, { idGoalScorer: null });
                console.log(`[Service - splitBoardAndPromotePlayers] Cleared GS position for user ${user.id} from board ${originalBoard.id} (Level ${previousLevelId}) before adding to tail.`);
            } else {
                console.warn(`[Service - splitBoardAndPromotePlayers] Could not find original board for user ${user.id} at level ${previousLevelId} to clear GS spot before adding to tail.`);
            }

            // Add user to the 'tail' table
            try {
                // Check if user is already in tail before inserting
                const existingTailEntry = await queryRunner.manager.findOne('tail', { where: { idUser: user.id } });
                if (!existingTailEntry) {
                    await queryRunner.manager.insert('tail', { idUser: user.id });
                    console.log(`[Service - splitBoardAndPromotePlayers] User ${user.id} inserted into tail.`);
                } else {
                    console.warn(`[Service - splitBoardAndPromotePlayers] User ${user.id} already exists in tail. Skipping insert.`);
                }
            } catch (insertError: any) {
                // Log other potential errors during insert
                console.error(`[Service - splitBoardAndPromotePlayers] Error inserting user ${user.id} into tail:`, insertError);
                // Depending on policy, you might want to re-throw the error or just log it
            }
        }
    }
  }
  // --- FIN NUEVO ---

  // After all assignments and board restructurings, process any generals awaiting slots
  console.log(`[Service - splitBoardAndPromotePlayers] Attempting to process generals awaiting slots after board split and initial filling.`);
  await processGeneralsAwaitingSlots(queryRunner);
  console.log(`[Service - splitBoardAndPromotePlayers] Finished processing generals awaiting slots.`);

  return { splitBoardA_Id: savedNewBoardA.id, splitBoardB_Id: savedNewBoardB.id };
};
    // Helper function to find the next available RECRUIT slot
    export const findNextAvailableRecruitSlotService = async (
      levelId: number,
      queryRunner: QueryRunner,
      excludeBoardId?: number 
    ): Promise<{ boardId: number; positionName: keyof Board } | null> => {
      const recruitPositionSearchOrder: (keyof Board)[] = [
        "idDefender1", "idDefender2", "idDefender3", "idDefender4",
        "idDefender5", "idDefender6", "idDefender7", "idDefender8"
      ];

      const whereConditions: any = {
        idLevelId: levelId,
        idBoardState: BOARD_STATE_ACTIVE_ID, // Usar la constante global
      };

      if (excludeBoardId) {
        whereConditions.id = Not(excludeBoardId); // Asegúrate que 'Not' esté importado de 'typeorm'
      }
    
      const boardsInLevel = await queryRunner.manager.find(Board, {
        where: whereConditions,
        order: { id: "ASC" }, 
      });
    
      for (const board of boardsInLevel) {
        for (const positionName of recruitPositionSearchOrder) {
          if (board.hasOwnProperty(positionName) && board[positionName] === null) {
            console.log(`[Service - findNextAvailableRecruitSlot] Found RECRUIT slot '${positionName as string}' in board ID: ${board.id}`);
            return { boardId: board.id, positionName };
          }
        }
      }
    
      console.log(`[Service - findNextAvailableRecruitSlot] No available RECRUIT slots found for level ID: ${levelId}.`);
      return null;
    };

export const setupPotentialDualRoleForGeneralService = async (
  generalUserId: number,
  primaryBoardId: number,
  primaryLevelId: number,
  queryRunner: QueryRunner
): Promise<void> => {
  console.log(`[Service - setupPotentialDualRole] START: User ID: ${generalUserId}, Primary Board ID: ${primaryBoardId}, Primary Level ID: ${primaryLevelId}`);
  const generalUser = await queryRunner.manager.findOne(EntityUser, { where: { id: generalUserId } });
  if (!generalUser) {
    console.error(`[Service - setupPotentialDualRole] General user with ID ${generalUserId} not found.`);
    return;
  }

  // Check if user is an admin (has admin role, idRole = 1)
  const isAdminUser = generalUser.idRole === 1;
  if (isAdminUser) {
    console.log(`[Service - setupPotentialDualRole] User ${generalUserId} is an ADMIN (idRole = 1). Special handling applies.`);
    
    // For administrators, clear any secondary roles and allow them to verify recruits
    // but don't assign them to any secondary roles
  generalUser.secondaryBoardIdAsRecruit = null;
  generalUser.secondaryBoardLevelIdAsRecruit = null;
  generalUser.secondaryPositionAsRecruit = null;
    generalUser.canVerifyRecruits = true;
    
    // Save immediately and exit - admins don't get secondary roles
    await queryRunner.manager.save(generalUser);
    return;
  }

  // For non-admin users, continue with normal processing
  // ✅ NUEVA VERIFICACIÓN: Verificar si el usuario ya tiene un rol secundario válido preservado
  // Esto puede ocurrir cuando un usuario verificado asciende pero mantiene su verificación
  if (generalUser.secondaryBoardIdAsRecruit && 
      generalUser.secondaryBoardLevelIdAsRecruit && 
      generalUser.secondaryPositionAsRecruit) {
    
    console.log(`[Service - setupPotentialDualRole] User ${generalUserId} already has preserved secondary role: Board ${generalUser.secondaryBoardIdAsRecruit}, Position ${generalUser.secondaryPositionAsRecruit}, Level ${generalUser.secondaryBoardLevelIdAsRecruit}`);
    
    // ✅ NUEVA LÓGICA: Verificar si el nivel del rol dual actual es diferente al nivel objetivo
    const targetRecruitLevelIdCalculated = primaryLevelId + 1;
    
    // Si el rol dual actual está en un nivel diferente al objetivo, necesitamos actualizarlo
    if (generalUser.secondaryBoardLevelIdAsRecruit !== targetRecruitLevelIdCalculated) {
      console.log(`[Service - setupPotentialDualRole] User ${generalUserId} has secondary role in DIFFERENT level. Current: ${generalUser.secondaryBoardLevelIdAsRecruit}, Target: ${targetRecruitLevelIdCalculated}. UPDATING to target level.`);
      
      // Limpiar la posición anterior
      try {
        const oldSecondaryBoard = await queryRunner.manager.findOne(Board, { where: { id: generalUser.secondaryBoardIdAsRecruit } });
        if (oldSecondaryBoard && 
            generalUser.secondaryPositionAsRecruit in oldSecondaryBoard && 
            oldSecondaryBoard[generalUser.secondaryPositionAsRecruit as keyof Board] === generalUserId) {
          
          await queryRunner.manager.update(Board, generalUser.secondaryBoardIdAsRecruit, { 
            [generalUser.secondaryPositionAsRecruit]: null 
          });
          console.log(`[Service - setupPotentialDualRole] Cleaned old secondary position ${generalUser.secondaryPositionAsRecruit} from board ${generalUser.secondaryBoardIdAsRecruit}`);
        }
      } catch (cleanupError: any) {
        console.error(`[Service - setupPotentialDualRole] Error cleaning old secondary position: ${cleanupError.message}`);
      }
      
      // Limpiar campos para permitir que se asigne nuevo rol dual
  generalUser.secondaryBoardIdAsRecruit = null;
  generalUser.secondaryBoardLevelIdAsRecruit = null;
  generalUser.secondaryPositionAsRecruit = null;
  generalUser.canVerifyRecruits = false;
      
      // ✅ NUEVO: Resetear unlockCount cuando se cambia de rol dual
      // Esto es crítico porque el unlockCount es global y puede contener 
      // desbloqueos del rol dual anterior (ej. Genesis→Armagedón)
      // Cuando se asigna nuevo rol dual (ej. Armagedón→Apolo), debe empezar en 0
      generalUser.unlockCount = 0;
      
      console.log(`[Service - setupPotentialDualRole] Cleared secondary role fields AND RESET unlockCount to 0. Will continue to assign new role in target level ${targetRecruitLevelIdCalculated}.`);
      
    } else {
      // El rol dual está en el nivel correcto, verificar consistencia
      const secondaryBoard = await queryRunner.manager.findOne(Board, { where: { id: generalUser.secondaryBoardIdAsRecruit } });
      if (secondaryBoard && 
          generalUser.secondaryPositionAsRecruit in secondaryBoard && 
          secondaryBoard[generalUser.secondaryPositionAsRecruit as keyof Board] === generalUserId) {
        
        console.log(`[Service - setupPotentialDualRole] Confirmed: User ${generalUserId} position is preserved in CORRECT target level ${targetRecruitLevelIdCalculated}. Setting canVerifyRecruits=true and exiting.`);
        
        // Solo actualizar canVerifyRecruits y salir
        generalUser.canVerifyRecruits = true;
        await queryRunner.manager.save(EntityUser, generalUser);
        return;
      } else {
        console.log(`[Service - setupPotentialDualRole] Warning: User ${generalUserId} has secondary role fields in correct level but position verification failed. Continuing with normal flow.`);
        
        // Limpiar campos para permitir reasignación
        generalUser.secondaryBoardIdAsRecruit = null;
        generalUser.secondaryBoardLevelIdAsRecruit = null;
        generalUser.secondaryPositionAsRecruit = null;
        generalUser.canVerifyRecruits = false;
      }
    }
  } else {
    // No tiene rol dual existente, limpiar campos por precaución
    generalUser.secondaryBoardIdAsRecruit = null;
    generalUser.secondaryBoardLevelIdAsRecruit = null;
    generalUser.secondaryPositionAsRecruit = null;
    generalUser.canVerifyRecruits = false;
    
    // ✅ NUEVO: Resetear unlockCount para nuevos roles duales
    // Aunque no tenga rol dual anterior, es buena práctica resetear
    // el contador para asegurar que inicie limpio en el nuevo contexto
    generalUser.unlockCount = 0;
    
    console.log(`[Service - setupPotentialDualRole] No existing dual role. Cleared fields AND RESET unlockCount to 0 for clean start.`);
  }

  const neptunoLevelId = 4;
  if (primaryLevelId === neptunoLevelId) {
    console.log(`[Service - setupPotentialDualRole] General ${generalUserId} is on Neptuno (Level ${primaryLevelId}). No secondary role. Can verify recruits.`);
    generalUser.canVerifyRecruits = true;
    await queryRunner.manager.save(generalUser);
    return;
  }

  const targetRecruitLevelIdCalculated = primaryLevelId + 1;
  const targetRecruitLevelEntity = await queryRunner.manager.findOne(Level, { where: { id: targetRecruitLevelIdCalculated } });

  if (!targetRecruitLevelEntity) {
    console.log(`[Service - setupPotentialDualRole] No target recruit level found for primaryLevelId ${primaryLevelId}. General ${generalUserId} might be at max level. Can verify recruits.`);
    generalUser.canVerifyRecruits = true;
    await queryRunner.manager.save(generalUser);
    return;
  }
  const targetRecruitLevelId = targetRecruitLevelEntity.id;
  console.log(`[Service - setupPotentialDualRole] Target RECRUIT level for secondary role: ${targetRecruitLevelEntity.name} (ID: ${targetRecruitLevelId}).`);

  // Clear any previous waiting entries for this user BEFORE new evaluation
  try {
    await queryRunner.query('DELETE FROM general_awaiting_recruit_slot WHERE userId = ?', [generalUserId]);
    console.log(`[Service - setupPotentialDualRole] Cleared previous waiting entries for user ${generalUserId}.`);
  } catch (deleteError: any) {
    console.error(`[Service - setupPotentialDualRole] ERROR during delete operation for user ${generalUserId}:`, deleteError);
    throw new Error(`Failed to clear previous waiting entries: ${deleteError.message}`);
  }

  let foundHigherRankSlotInfo: { boardId: number; positionName: string } | null = null;
  if (!isAdminUser) {
    console.log(`[Service - setupPotentialDualRole] User ${generalUserId} is PLAYER. Checking for higher-rank slots on Target Level ${targetRecruitLevelId}.`);
  const otherActiveBoardsOnTargetLevel = await queryRunner.manager.find(Board, {
      where: { idLevelId: targetRecruitLevelId, idBoardState: BOARD_STATE_ACTIVE_ID },
    order: { createAt: "ASC" },
  });
    const higherRankPositionSearchOrder: (keyof Board)[] = ["idGoalScorer", "idCreator1", "idCreator2", "idGenerator1", "idGenerator2", "idGenerator3", "idGenerator4"];
  for (const board of otherActiveBoardsOnTargetLevel) {
      if (board.id === primaryBoardId && primaryLevelId === targetRecruitLevelId) continue;
    for (const positionName of higherRankPositionSearchOrder) {
      if (board.hasOwnProperty(positionName) && board[positionName] === null) {
        foundHigherRankSlotInfo = { boardId: board.id, positionName: positionName as string };
        console.log(`[Service - setupPotentialDualRole] Found HIGHER-RANK slot '${foundHigherRankSlotInfo.positionName}' on board ${foundHigherRankSlotInfo.boardId} in Target Level ${targetRecruitLevelId}.`);
        break;
      }
    }
    if (foundHigherRankSlotInfo) break;
  }
  }

  const availableRecruitSlot = await findNextAvailableRecruitSlotService(targetRecruitLevelId, queryRunner, (generalUser.id === primaryBoardId && primaryLevelId === targetRecruitLevelId) ? primaryBoardId : undefined);

  if (availableRecruitSlot) {
    console.log(`[Service - setupPotentialDualRole] Found available RECRUIT slot for General ${generalUserId} on Board ID: ${availableRecruitSlot.boardId}, Position: ${availableRecruitSlot.positionName}.`);
    await queryRunner.manager.update(Board, availableRecruitSlot.boardId, { [availableRecruitSlot.positionName]: generalUserId });
    generalUser.secondaryBoardIdAsRecruit = availableRecruitSlot.boardId;
      generalUser.secondaryBoardLevelIdAsRecruit = targetRecruitLevelId;
    generalUser.secondaryPositionAsRecruit = availableRecruitSlot.positionName as string;
      generalUser.canVerifyRecruits = true;
    
    // ✅ NUEVO: Resetear unlockCount al asignar nuevo rol de recluta
    // Esto asegura que el nuevo rol dual inicie con contador limpio
    // independientemente de cuántos desbloqueos tuvo en roles anteriores
    generalUser.unlockCount = 0;
    
    console.log(`[Service - setupPotentialDualRole] General ${generalUserId} assigned to secondary role. CanVerifyRecruits: true. UnlockCount RESET to 0.`);
    
    // START: Manage Subscription for the new secondary role (Código de Subscription permanece igual)
    try {
      const existingSubscription = await queryRunner.manager.findOne(Subscription, {
        where: { idUser: generalUserId, idBoard: availableRecruitSlot.boardId }
      });
      if (existingSubscription) {
        if (existingSubscription.idSubscriptionState !== 1) {
          await queryRunner.manager.update(Subscription, existingSubscription.id, { idSubscriptionState: 1, updateAt: new Date() });
          console.log(`[Service - setupPotentialDualRole] Updated existing subscription to ACTIVE for secondary board ${availableRecruitSlot.boardId}.`);
        }
      } else {
        await queryRunner.manager.insert(Subscription, {
          idUser: generalUserId,
          idBoard: availableRecruitSlot.boardId,
          idSubscriptionState: 1, // Active
          // createAt and updateAt should be handled by DB or TypeORM default/decorators
        });
        console.log(`[Service - setupPotentialDualRole] Inserted new ACTIVE subscription for secondary board ${availableRecruitSlot.boardId}.`);
      }
    } catch (subError: any) {
      console.error(`[Service - setupPotentialDualRole] FAILED to manage subscription for secondary board ${availableRecruitSlot.boardId}:`, subError);
    }
    // END: Manage Subscription

  } else { // No available recruit slot
    let reasonForWaiting: WaitingReason | null = null;
    if (!isAdminUser && foundHigherRankSlotInfo) {
      reasonForWaiting = WaitingReason.HIGHER_RANK_SLOTS_EXIST;
      console.log(`[Service - setupPotentialDualRole] PLAYER ${generalUserId} will WAIT. Reason: ${reasonForWaiting} (Higher ranks exist and no direct recruit slot).`);
    } else if (!availableRecruitSlot) { 
      reasonForWaiting = WaitingReason.NO_RECRUIT_SLOTS;
      console.log(`[Service - setupPotentialDualRole] User ${generalUserId} (Admin: ${isAdminUser}) will WAIT. Reason: ${reasonForWaiting} (No recruit slots).`);
    }

    if (reasonForWaiting) {
      try {
        await queryRunner.query(
          'INSERT INTO general_awaiting_recruit_slot (userId, primaryBoardId, primaryLevelId, targetRecruitLevelId, reasonForWaiting, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [generalUserId, primaryBoardId, primaryLevelId, targetRecruitLevelId, reasonForWaiting]
        );
        console.log(`[Service - setupPotentialDualRole] Successfully inserted into general_awaiting_recruit_slot for user ${generalUserId} (Reason: ${reasonForWaiting}).`);
      } catch (insertError: any) {
        console.error(`[Service - setupPotentialDualRole] ERROR inserting into waiting queue (Reason: ${reasonForWaiting}):`, insertError);
        throw new Error(`Failed to add to waiting queue: ${insertError.message}`);
      }
      generalUser.canVerifyRecruits = false;
    } else {
        // Esto no debería ocurrir si la lógica es correcta, pero como salvaguarda:
        console.log(`[Service - setupPotentialDualRole] User ${generalUserId} (Admin: ${isAdminUser}) NOT waiting and NO recruit slot found, but no specific waiting reason. Setting canVerifyRecruits=true as fallback for primary board.`);
        generalUser.canVerifyRecruits = true; // Allow to verify on primary board if not waiting and no slot
    }
  }

  console.log(`[Service - setupPotentialDualRole] Finalizing user update for ${generalUserId}. canVerifyRecruits: ${generalUser.canVerifyRecruits}, secondaryBoardId: ${generalUser.secondaryBoardIdAsRecruit}`);
  await queryRunner.manager.save(EntityUser, generalUser);
  console.log(`[Service - setupPotentialDualRole] Successfully saved updates for General ${generalUserId}.`);
  console.log(`[Service - setupPotentialDualRole] END: User ID: ${generalUserId}`);
};

export const promoteGoalScorerToNextLevelService = async (
  goalScorerData: LoginUserData,
  currentLevelIdInput: number,
  originalBoardId: number,
  queryRunner?: QueryRunner
): Promise<PromotionServiceResponse> => {
  let localQueryRunner: QueryRunner;
  let shouldReleaseQueryRunner = false;

  let boardToPromoteToId: number | undefined;
  let splitBoardA_Id: number | undefined;
  let splitBoardB_Id: number | undefined;

  if (!queryRunner) {
    localQueryRunner = AppDataSource.createQueryRunner();
    await localQueryRunner.connect();
    await localQueryRunner.startTransaction();
    shouldReleaseQueryRunner = true;
  } else {
    localQueryRunner = queryRunner;
  }

  try {
    // 1. LIMPIEZA DEL ROL SECUNDARIO ANTERIOR (SI EXISTE) - LÓGICA MEJORADA PARA TODOS LOS NIVELES
    const userToPromote = await localQueryRunner.manager.findOne(EntityUser, { where: { id: goalScorerData.id } });
    if (userToPromote && userToPromote.secondaryBoardIdAsRecruit && userToPromote.secondaryPositionAsRecruit) {
      console.log(`[Service - PromoteGoalScorer] User ${goalScorerData.id} has existing secondary role on board ${userToPromote.secondaryBoardIdAsRecruit}. Checking verification status.`);
      
      // ✅ LÓGICA MEJORADA: Verificar si está verificado INDEPENDIENTEMENTE del nivel
      const isAlreadyVerified = userToPromote.idUserProcessState === 4; // 4 = VALIDATED
      
      if (isAlreadyVerified) {
        console.log(`[Service - PromoteGoalScorer] User ${goalScorerData.id} is already VERIFIED in secondary role. PRESERVING verification and position for ALL LEVELS to avoid double verification.`);
        // ✅ PRESERVAR TODO: No eliminamos la posición del tablero NI los campos del usuario
        // De esta manera setupPotentialDualRoleForGeneralService NO intentará buscar una nueva posición
        // ya que detectará que el usuario ya tiene un rol secundario asignado y está verificado
        console.log(`[Service - PromoteGoalScorer] Keeping secondary role intact for ANY LEVEL: Board ${userToPromote.secondaryBoardIdAsRecruit}, Position ${userToPromote.secondaryPositionAsRecruit}, Level ${userToPromote.secondaryBoardLevelIdAsRecruit}`);
        // NO hacemos ninguna actualización de los campos del usuario - todo se preserva
      } else {
        console.log(`[Service - PromoteGoalScorer] User ${goalScorerData.id} is NOT verified in secondary role. Cleaning up position normally.`);
        // Lógica original: limpiar completamente si no está verificado
      try {
        const oldSecondaryBoard = await localQueryRunner.manager.findOne(Board, { where: { id: userToPromote.secondaryBoardIdAsRecruit } });
        if (oldSecondaryBoard && userToPromote.secondaryPositionAsRecruit &&
            typeof userToPromote.secondaryPositionAsRecruit === 'string' &&
            userToPromote.secondaryPositionAsRecruit in oldSecondaryBoard && // Check if key exists
            oldSecondaryBoard[userToPromote.secondaryPositionAsRecruit as keyof Board] === goalScorerData.id) {
          await localQueryRunner.manager.update(Board, userToPromote.secondaryBoardIdAsRecruit, { [userToPromote.secondaryPositionAsRecruit]: null });
        }
      } catch (e: any) {
        console.error(`[Service - PromoteGoalScorer] Error cleaning old secondary board: ${e.message}`);
      }
      await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
        secondaryBoardIdAsRecruit: null,
        secondaryBoardLevelIdAsRecruit: null,
        secondaryPositionAsRecruit: null,
      });
      }
    }

    const currentLevelEntity = await localQueryRunner.manager.findOne(Level, { where: { id: currentLevelIdInput } });
    if (!currentLevelEntity) throw new Error(`Nivel actual ID ${currentLevelIdInput} no encontrado.`);

    const nextLevelIdCalculated = currentLevelEntity.id + 1;
    const nextLevelEntity = await localQueryRunner.manager.findOne(Level, { where: { id: nextLevelIdCalculated } });

    let messageResponse = "";

    // Check if the user is an admin - only users with role ID 1 (ADMINISTRATOR) are considered admins
    const isAdminUser = userToPromote!.idRole === 1;
    
    console.log(`[Service - PromoteGoalScorer] Admin Check: isAdminUser=${isAdminUser}, userId=${userToPromote!.id}, userRole=${userToPromote!.idRole}`);

    if (!nextLevelEntity) { // CASO NEPTUNO (ÚLTIMO NIVEL)
      console.log(`[Service - PromoteGoalScorer] ${goalScorerData.username} alcanzó el nivel máximo.`);
      await localQueryRunner.manager.update(Board, originalBoardId, { idGoalScorer: null });
      messageResponse = `¡Felicidades ${goalScorerData.username}! Has completado el juego.`;
      await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
        idUserProcessState: UserProcessStateId.COMPLETADO, // Asumiendo que tienes este estado
        secondaryBoardIdAsRecruit: null,
        secondaryBoardLevelIdAsRecruit: null,
        secondaryPositionAsRecruit: null,
      });
      
      // ✅ NUEVO: Eliminar subscription ya que el usuario completó el juego
      console.log(`[Service - PromoteGoalScorer] Removing subscription for completed user ${goalScorerData.id}`);
      await localQueryRunner.manager.delete(Subscription, { 
        idUser: goalScorerData.id,
        idBoard: originalBoardId 
      });
      console.log(`[Service - PromoteGoalScorer] User ${goalScorerData.username} subscription removed. Game completed!`);
    } else { // ASCIENDE A UN SIGUIENTE NIVEL (todos los usuarios, admin y player)
      const availableSlot = await findNextAvailableBoardSlotService(nextLevelEntity.id, localQueryRunner);

      if (availableSlot) {
        await localQueryRunner.manager.update(Board, availableSlot.boardId, { [availableSlot.positionName]: goalScorerData.id });
        boardToPromoteToId = availableSlot.boardId;
        const positionNameStr = availableSlot.positionName as string;
        let newUserProcessState: UserProcessStateId;

        if (positionNameStr.startsWith("idDefender")) { // Promoted to Recruit
          newUserProcessState = UserProcessStateId.WAITING; // PENDIENTE_APROBACION_GENERAL -> WAITING (ID 1)
          messageResponse = `Jugador ${goalScorerData.username} promovido como RECLUTA al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}), posición ${positionNameStr}. Esperando verificación.`;
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            idUserProcessState: newUserProcessState,
            secondaryBoardIdAsRecruit: null, 
            secondaryBoardLevelIdAsRecruit: null,
            secondaryPositionAsRecruit: null,
          });
        } else if (positionNameStr === "idGoalScorer") { // Promoted to General
          newUserProcessState = UserProcessStateId.WAITING; // PENDIENTE_APROBACION_GENERAL -> WAITING (ID 1)
          // Actualizar el rol principal del usuario a General en el nuevo tablero.
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            idUserProcessState: newUserProcessState,
            // Los campos secundarios se manejan DESPUÉS por setupPotentialDualRoleForGeneralService
            // Aquí solo nos enfocamos en el rol principal.
            // secondaryBoardIdAsRecruit: null, // Se limpian/establecen en setupPotentialDualRole
            // secondaryBoardLevelIdAsRecruit: null,
            // secondaryPositionAsRecruit: null,
          });
          console.log(`[Service - PromoteGoalScorer] User ${goalScorerData.id} updated to General on board ${boardToPromoteToId}. Now checking for dual role.`);
          
          // <<< START: Setup Dual Role for the General who just got promoted to General >>>
          // Skip dual role setup for admin users
          if (isAdminUser) {
            console.log(`[Service - PromoteGoalScorer] Skipping dual role setup for admin user ${goalScorerData.id}.`);
          } else {
            // For non-admin users, setup dual role
          // Esto buscará un slot de Recluta en el nivel (nextLevelEntity.id + 1)
          console.log('[PromoteGS] BEFORE setupPotentialDualRoleForGeneralService');
          await setupPotentialDualRoleForGeneralService(goalScorerData.id, boardToPromoteToId!, nextLevelEntity.id, localQueryRunner);
          console.log('[PromoteGS] AFTER setupPotentialDualRoleForGeneralService');
          console.log(`[Service - PromoteGoalScorer] Called setupPotentialDualRole for General ${goalScorerData.id} who was promoted to General on board ${boardToPromoteToId}`);
          }
          // <<< END: Setup Dual Role >>>

          // After the primary promotion and dual role setup, process any generals awaiting slots
          console.log(`[Service - PromoteGoalScorer] Attempting to process generals awaiting slots after GS promotion.`);
          await processGeneralsAwaitingSlots(localQueryRunner);
          console.log(`[Service - PromoteGoalScorer] Finished processing generals awaiting slots after GS promotion.`);

          messageResponse = `Jugador ${goalScorerData.username} promovido como GENERAL al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}), posición ${positionNameStr}. Esperando verificación.`;

        } else if (positionNameStr === "idCreator1" || positionNameStr === "idCreator2") { // Promoted to Commander
          newUserProcessState = UserProcessStateId.VALIDATED; 
          messageResponse = `Jugador ${goalScorerData.username} promovido como ${positionNameStr.replace("id","")} al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}), posición ${positionNameStr}.`;
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            idUserProcessState: newUserProcessState,
            secondaryBoardIdAsRecruit: null, 
            secondaryBoardLevelIdAsRecruit: null,
            secondaryPositionAsRecruit: null,
          });
        } else { // Promoted to Commander or Sergeant
          newUserProcessState = UserProcessStateId.VALIDATED; 
          messageResponse = `Jugador ${goalScorerData.username} promovido como ${positionNameStr.replace("id","")} al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}), posición ${positionNameStr}.`;
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            idUserProcessState: newUserProcessState,
            secondaryBoardIdAsRecruit: null, 
            secondaryBoardLevelIdAsRecruit: null,
            secondaryPositionAsRecruit: null,
          });
        }
      } else { // VA A LA COLA
        messageResponse = `Jugador ${goalScorerData.username} no encontró posición en ${nextLevelEntity.name} y fue enviado a la cola.`;
        await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
          idUserProcessState: UserProcessStateId.WAITING, // Cambiado de EN_COLA a WAITING
          secondaryBoardIdAsRecruit: null, // Nulo porque va a la cola
          secondaryBoardLevelIdAsRecruit: null,
          secondaryPositionAsRecruit: null,
        });
        // Lógica para añadir a la tabla 'tail'... (asegúrate que no haya duplicados)
        const existingTailEntry = await localQueryRunner.manager.findOne('tail', { where: { idUser: goalScorerData.id } });
        if (!existingTailEntry) {
            await localQueryRunner.manager.insert('tail', { idUser: goalScorerData.id });
        }
      }

      // Eliminar del tablero original y actualizar suscripción (si no fue a Neptuno)
      await localQueryRunner.manager.update(Board, originalBoardId, { idGoalScorer: null });
      if (boardToPromoteToId) {
        // Lógica de actualización/creación de suscripción...
         const updateResult = await localQueryRunner.manager.update(Subscription,
          { idUser: goalScorerData.id },
          { idBoard: boardToPromoteToId, idSubscriptionState: 1 }
        );
        if (!updateResult.affected || updateResult.affected === 0) {
            await localQueryRunner.manager.insert(Subscription, {
                idUser: goalScorerData.id,
                idBoard: boardToPromoteToId,
                idSubscriptionState: 1
            });
        }
      }
    }

    // 3. ELIMINACIÓN DE LÓGICA ANTIGUA DE DOBLE ROL
    // Asegúrate de que el bloque de código que estaba entre:
    // "// <<< START: Logic for dual role - placing user as RECRUIT on N+1 board >>>"
    // y "// <<< END: Logic for dual role >>>"
    // HAYA SIDO COMPLETAMENTE ELIMINADO.

    // DIVISIÓN DEL TABLERO ORIGINAL - Para TODOS los niveles cuando el General completa
    // ✅ CORREGIDO: El tablero SIEMPRE se divide, incluso en Neptuno
      console.log(`[Service - PromoteGoalScorer] Initiating board split for user ${goalScorerData.id}.`);
    const originalBoardEntityToSplit = await localQueryRunner.manager.findOne(Board, { where: { id: originalBoardId } });
    if (originalBoardEntityToSplit) {
        // Always proceed with board split when GoalScorer is being promoted
        console.log(`[Service - PromoteGoalScorer] Proceeding with board split for ${originalBoardId}`);
        
        // Simply log the current state of defenders for debugging purposes
        console.log(`[Service - PromoteGoalScorer] Board ${originalBoardId} defender status:
          D1: ${originalBoardEntityToSplit.idDefender1 ? 'FILLED' : 'EMPTY'},
          D2: ${originalBoardEntityToSplit.idDefender2 ? 'FILLED' : 'EMPTY'},
          D3: ${originalBoardEntityToSplit.idDefender3 ? 'FILLED' : 'EMPTY'},
          D4: ${originalBoardEntityToSplit.idDefender4 ? 'FILLED' : 'EMPTY'},
          D5: ${originalBoardEntityToSplit.idDefender5 ? 'FILLED' : 'EMPTY'},
          D6: ${originalBoardEntityToSplit.idDefender6 ? 'FILLED' : 'EMPTY'},
          D7: ${originalBoardEntityToSplit.idDefender7 ? 'FILLED' : 'EMPTY'},
          D8: ${originalBoardEntityToSplit.idDefender8 ? 'FILLED' : 'EMPTY'}`);
        
        console.log(`[Service - PromoteGoalScorer] Splitting board ${originalBoardId} with level ${currentLevelEntity.id}`);
      const splitResult = await splitBoardAndPromotePlayers(originalBoardEntityToSplit, currentLevelEntity.id, localQueryRunner);
      splitBoardA_Id = splitResult.splitBoardA_Id;
      splitBoardB_Id = splitResult.splitBoardB_Id;
        
        if (nextLevelEntity) {
      messageResponse += ` El tablero original ${originalBoardId} se dividió en ${splitBoardA_Id} y ${splitBoardB_Id}.`;
    } else {
          // Caso Neptuno: El general completó pero el tablero se divide para los demás jugadores
          messageResponse += ` El tablero de Neptuno ${originalBoardId} se dividió en ${splitBoardA_Id} y ${splitBoardB_Id} para continuar el juego de los demás jugadores.`;
      }
    } else {
      messageResponse += ` ADVERTENCIA: No se pudo encontrar el tablero original ${originalBoardId} para división.`;
    }

    if (shouldReleaseQueryRunner) await localQueryRunner.commitTransaction();
    return { message: messageResponse, status: 200, promotedToBoardId: boardToPromoteToId, splitBoardA_Id, splitBoardB_Id };

  } catch (error: any) {
    if (shouldReleaseQueryRunner && localQueryRunner.isTransactionActive) await localQueryRunner.rollbackTransaction();
    return { message: error.message || 'Error en promoción.', status: 500 };
  } finally {
    if (shouldReleaseQueryRunner && localQueryRunner && !localQueryRunner.isReleased) await localQueryRunner.release();
  }
};

// Helper function to find the next available slot in a board of a specific level
export const findNextAvailableBoardSlotService = async (
  levelId: number,
  queryRunner: QueryRunner,
  preferredBoardId?: number
): Promise<{ boardId: number; positionName: keyof Board } | null> => {
  const positionSearchOrder: (keyof Board)[] = [
    "idGoalScorer", "idCreator1", "idCreator2",
    "idGenerator1", "idGenerator2", "idGenerator3", "idGenerator4",
    "idDefender1", "idDefender2", "idDefender3", "idDefender4",
    "idDefender5", "idDefender6", "idDefender7", "idDefender8"
  ];

  let preferredBoardCheckedAndFull = false;

  if (preferredBoardId) {
    const preferredBoard = await queryRunner.manager.findOne(Board, {
      where: { id: preferredBoardId, idLevelId: levelId, idBoardState: BOARD_STATE_ACTIVE_ID }
    });
    if (preferredBoard) {
      for (const positionName of positionSearchOrder) {
        if (preferredBoard[positionName] === null) {
          console.log(`[Service - findNextAvailableBoardSlot] Found slot '${positionName as string}' in preferred board ID: ${preferredBoardId}`);
          return { boardId: preferredBoard.id, positionName };
        }
      }
      // If we reach here, the preferred board was found but is full.
      preferredBoardCheckedAndFull = true;
      console.log(`[Service - findNextAvailableBoardSlot] Preferred board ID: ${preferredBoardId} found but is full.`);
    } else {
      console.log(`[Service - findNextAvailableBoardSlot] Preferred board ID: ${preferredBoardId} not found or not in active state for level ${levelId}.`);
    }
  }

  // Define search criteria for other boards
  const findConditions: any = {
    idLevelId: levelId,
    idBoardState: BOARD_STATE_ACTIVE_ID,
  };

  // If a preferred board was checked (whether full or not found suitable initially),
  // exclude it from the search for "other" boards to avoid reprocessing or errors.
  if (preferredBoardId) {
    findConditions.id = Not(Equal(preferredBoardId));
  }

  const otherBoards = await queryRunner.manager.find(Board, {
    where: findConditions,
    order: { createAt: "ASC" } // Process oldest boards first
  });

  for (const board of otherBoards) {
    for (const positionName of positionSearchOrder) {
      if (board[positionName] === null) {
        console.log(`[Service - findNextAvailableBoardSlot] Found slot '${positionName as string}' in board ID: ${board.id}`);
        return { boardId: board.id, positionName };
      }
    }
  }
  
  // If preferred board was checked and full, and no other board had a slot
  if (preferredBoardCheckedAndFull) {
     console.log(`[Service - findNextAvailableBoardSlot] Preferred board ID: ${preferredBoardId} was full, and no other boards have available slots in level ID: ${levelId}.`);
     return null;
  }

  console.log(`[Service - findNextAvailableBoardSlot] No available slot found in any board for level ID: ${levelId}.`);
  return null;
};

export const processGeneralsAwaitingSlots = async (queryRunner: QueryRunner): Promise<void> => {
  console.log("[Service - processGeneralsAwaitingSlots] START: Processing generals awaiting recruit slots.");

  const awaitingGenerals = await queryRunner.manager.find(GeneralAwaitingRecruitSlot, {
    order: { createdAt: "ASC" }, // Process oldest requests first
    relations: ["user"], // Load user relation to update canVerifyRecruits
  });

  if (awaitingGenerals.length === 0) {
    console.log("[Service - processGeneralsAwaitingSlots] No generals currently awaiting recruit slots.");
    return;
  }

  console.log(`[Service - processGeneralsAwaitingSlots] Found ${awaitingGenerals.length} general(s) awaiting slots.`);

  for (const pendingGeneral of awaitingGenerals) {
    const { userId, primaryBoardId, primaryLevelId, targetRecruitLevelId, user: generalUser } = pendingGeneral;

    if (!generalUser) {
        console.error(`[Service - processGeneralsAwaitingSlots] User data not found for pendingGeneral ID: ${pendingGeneral.id}, UserID: ${userId}. Skipping.`);
        continue;
    }

    console.log(`[Service - processGeneralsAwaitingSlots] Processing General ID: ${userId}, awaiting slot in Level ID: ${targetRecruitLevelId}.`);

    // 1. Re-check: Still no HIGHER-RANK slots on the target recruit level?
    const higherRankPositionSearchOrder: (keyof Board)[] = [
      "idGoalScorer", "idCreator1", "idCreator2",
      "idGenerator1", "idGenerator2", "idGenerator3", "idGenerator4",
    ];
    const otherActiveBoardsOnTargetLevel = await queryRunner.manager.find(Board, {
      where: { idLevelId: targetRecruitLevelId, idBoardState: BOARD_STATE_ACTIVE_ID },
      order: { createAt: "ASC" },
    });

    let स्टिलHasHigherRankSlot = false;
    for (const board of otherActiveBoardsOnTargetLevel) {
      for (const positionName of higherRankPositionSearchOrder) {
        if (board[positionName] === null) {
          स्टिलHasHigherRankSlot = true;
          console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - HIGHER-RANK slot '${positionName as string}' STILL EXISTS on board ${board.id} in Level ${targetRecruitLevelId}. General remains in queue.`);
          // Update reason if it changed (e.g. was NO_RECRUIT_SLOTS, now HIGHER_RANK_SLOTS_EXIST)
          if (pendingGeneral.reasonForWaiting !== WaitingReason.HIGHER_RANK_SLOTS_EXIST) {
            await queryRunner.manager.update(GeneralAwaitingRecruitSlot, pendingGeneral.id, { 
                reasonForWaiting: WaitingReason.HIGHER_RANK_SLOTS_EXIST,
                updatedAt: new Date()
            });
          }
          break;
        }
      }
      if (स्टिलHasHigherRankSlot) break;
    }

    if (स्टिलHasHigherRankSlot) {
      continue; // Move to the next general in the queue
    }

    // 2. If no higher-rank slots, try to find a RECRUIT slot on the target level.
    console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - NO higher-rank slots on Level ${targetRecruitLevelId}. Checking for RECRUIT slot.`);
    const recruitSlot = await findNextAvailableRecruitSlotService(targetRecruitLevelId, queryRunner, undefined); // CAMBIO AQUÍ

    if (recruitSlot) {
      console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - Found RECRUIT slot: Board ${recruitSlot.boardId}, Pos ${recruitSlot.positionName}. Assigning.`);
      
      generalUser.secondaryBoardIdAsRecruit = recruitSlot.boardId;
      generalUser.secondaryBoardLevelIdAsRecruit = targetRecruitLevelId;
      generalUser.secondaryPositionAsRecruit = recruitSlot.positionName as string;
      generalUser.canVerifyRecruits = true;
      await queryRunner.manager.save(generalUser); // Save changes to the user

      await queryRunner.manager.update(Board, recruitSlot.boardId, { [recruitSlot.positionName]: userId });
      
      let subscription = await queryRunner.manager.findOne(Subscription, {
          where: { idUser: userId, idBoard: recruitSlot.boardId }
      });
      if (subscription) {
          if (subscription.idSubscriptionState !== 1) { // 1 = Active
            await queryRunner.manager.update(Subscription, subscription.id, { idSubscriptionState: 1 });
            console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - Updated subscription to ACTIVE for secondary board ${recruitSlot.boardId}.`);
          }
      } else {
          await queryRunner.manager.insert(Subscription, {
              idUser: userId,
              idBoard: recruitSlot.boardId,
              idSubscriptionState: 1 // Active
          });
          console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - Inserted new ACTIVE subscription for secondary board ${recruitSlot.boardId}.`);
      }

      // Remove from awaiting queue
      await queryRunner.manager.delete(GeneralAwaitingRecruitSlot, { id: pendingGeneral.id });
      console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - Successfully assigned to Recruit slot and removed from queue.`);
    } else {
      console.log(`[Service - processGeneralsAwaitingSlots] General ID: ${userId} - NO Recruit slots currently available on Level ${targetRecruitLevelId}. General remains in queue.`);
      // Update reason if it changed (e.g. was HIGHER_RANK_SLOTS_EXIST, now NO_RECRUIT_SLOTS)
      if (pendingGeneral.reasonForWaiting !== WaitingReason.NO_RECRUIT_SLOTS) {
        await queryRunner.manager.update(GeneralAwaitingRecruitSlot, pendingGeneral.id, { 
            reasonForWaiting: WaitingReason.NO_RECRUIT_SLOTS,
            updatedAt: new Date()
        });
      }
    }
  } // end for loop

  console.log("[Service - processGeneralsAwaitingSlots] END: Finished processing generals awaiting recruit slots.");
};

interface ArmageddonError {
  code: string;
  details: string;
}

// NEW: Función para obtener los límites de desbloqueo según el nivel que desbloquea
const getUnlockLimitsForLevel = (actingLevelId: number): { maxUnlocks: number; targetLevelId: number } => {
  switch (actingLevelId) {
    case 2: // Armagedón desbloquea Génesis
      return { maxUnlocks: 2, targetLevelId: 1 };
    case 3: // Apolo desbloquea Armagedón  
      return { maxUnlocks: 3, targetLevelId: 2 };
    case 4: // Neptuno desbloquea Apolo
      return { maxUnlocks: 3, targetLevelId: 3 };
    default:
      throw new Error(`Nivel ${actingLevelId} no tiene capacidad de desbloqueo configurada`);
  }
};

// NEW: Función para determinar el estado del usuario según el contador y límite máximo
const determineUserStateByUnlockCount = (
  currentUnlocks: number, 
  maxUnlocks: number
): UserProcessStateId => {
  if (currentUnlocks === 0) {
    return UserProcessStateId.VALIDATING; // Primer desbloqueo
  } else if (currentUnlocks === maxUnlocks - 1) {
    return UserProcessStateId.READY_TO_ACCEPT; // Último desbloqueo
  } else if (currentUnlocks < maxUnlocks - 1) {
    return UserProcessStateId.VALIDATING; // Desbloqueos intermedios
  } else {
    throw new Error(`Estado de desbloqueo inválido: ${currentUnlocks} con máximo ${maxUnlocks}`);
  }
};

export const unlockLowerLevelBoardGenericService = async (
  generalUserId: number,
  defenderUsername: string,
  generalBoardId: number
): Promise<{
  success: boolean;
  message: string;
  data?: {
    username: string;
    unlockCount: number;
    state: string;
    maxUnlocks: number;
    targetBoardUnlocked?: boolean;
    targetBoardId?: number;
    targetBoardLevel?: string;
    targetBoardPreviousState?: string;
    targetBoardNewState?: string;
  };
  error?: ArmageddonError;
}> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log(`[unlockLowerLevelBoardGenericService] Starting unlock process for defender ${defenderUsername} by general ${generalUserId} in board ${generalBoardId}`);

    // 1. Verificar que el tablero del general existe y obtener el nivel
    const generalBoard = await queryRunner.manager.findOne(Board, {
      where: { id: generalBoardId }
    });

    if (!generalBoard) {
      throw {
        code: "BOARD_NOT_FOUND",
        details: "El tablero especificado no existe"
      } as ArmageddonError;
    }

    // 2. Verificar que el usuario que hace la petición es el General del tablero
    if (generalBoard.idGoalScorer !== generalUserId) {
      throw {
        code: "UNAUTHORIZED",
        details: "Solo el General del tablero puede realizar esta operación"
      } as ArmageddonError;
    }

    // 3. Obtener límites de desbloqueo según el nivel del general
    let unlockLimits;
    try {
      unlockLimits = getUnlockLimitsForLevel(generalBoard.idLevelId);
    } catch (error) {
      throw {
        code: "INVALID_BOARD_LEVEL",
        details: (error as Error).message
      } as ArmageddonError;
    }

    const { maxUnlocks, targetLevelId } = unlockLimits;

    // 4. Obtener el usuario defensor (recluta)
    const defenderUser = await queryRunner.manager.findOne(EntityUser, {
      where: { username: defenderUsername }
    });

    if (!defenderUser) {
      throw {
        code: "DEFENDER_NOT_FOUND",
        details: "El usuario defensor especificado no existe"
      } as ArmageddonError;
    }

    // 5. Encontrar el tablero objetivo del defensor (donde es General)
    const targetBoard = await queryRunner.manager.findOne(Board, {
      where: { 
        idGoalScorer: defenderUser.id,
        idLevelId: targetLevelId 
      }
    });

    if (!targetBoard) {
      throw {
        code: "TARGET_BOARD_NOT_FOUND",
        details: `El defensor no tiene un tablero como General en el nivel objetivo`
      } as ArmageddonError;
    }

    // 🚨 NUEVA VALIDACIÓN CRÍTICA: Verificar que el tablero esté efectivamente bloqueado
    console.log(`[unlockLowerLevelBoardGenericService] Target board state check - Board ID: ${targetBoard.id}, State: ${targetBoard.idBoardState}, Blockade Stage: ${targetBoard.currentBlockadeStage}`);
    
    if (targetBoard.idBoardState !== BoardStateNumericId.BLOCKED) {
      throw {
        code: "BOARD_NOT_BLOCKED",
        details: `El tablero del defensor no está bloqueado. Estado actual: ${targetBoard.idBoardState}. Solo se puede desbloquear tableros que estén en estado BLOCKED (3).`
      } as ArmageddonError;
    }

    if (!targetBoard.currentBlockadeStage || targetBoard.currentBlockadeStage <= 0) {
      throw {
        code: "NO_ACTIVE_BLOCKADE_STAGE",
        details: `El tablero del defensor no tiene una etapa de bloqueo activa. Etapa actual: ${targetBoard.currentBlockadeStage}. Solo se puede desbloquear tableros con etapas de bloqueo activas.`
      } as ArmageddonError;
    }

    // 🚨 VALIDACIÓN ESPECÍFICA PARA ARMAGEDÓN: Solo puede desbloquear etapas 1 y 2 de Génesis
    if (generalBoard.idLevelId === 2 && targetLevelId === 1) { // Armagedón → Génesis
      if (targetBoard.currentBlockadeStage > 2) {
        throw {
          code: "ARMAGEDDON_STAGE_RESTRICTION",
          details: `Armagedón solo puede desbloquear las etapas 1 y 2 de Génesis. Etapa actual: ${targetBoard.currentBlockadeStage}. Las etapas 3 y 4 requieren otros métodos de desbloqueo.`
        } as ArmageddonError;
      }
      console.log(`[unlockLowerLevelBoardGenericService] ✅ Armagedón restriction validated - Stage ${targetBoard.currentBlockadeStage} is allowed (1-2)`);
    } else {
      // Apolo y Neptuno pueden desbloquear todas las etapas de sus niveles objetivo
      console.log(`[unlockLowerLevelBoardGenericService] ✅ Higher level validation - Level ${generalBoard.idLevelId} can unlock all stages of level ${targetLevelId}`);
    }

    console.log(`[unlockLowerLevelBoardGenericService] ✅ Board validation passed - Board ${targetBoard.id} is BLOCKED with active blockade stage ${targetBoard.currentBlockadeStage}`);

    // 6. Validar el estado actual y el contador
    const currentUnlocks = defenderUser.unlockCount || 0;
    console.log(`[unlockLowerLevelBoardGenericService] Current unlock count for ${defenderUsername}: ${currentUnlocks}/${maxUnlocks}`);
    
    if (currentUnlocks >= maxUnlocks) {
      return {
        success: false,
        message: `El usuario ${defenderUsername} ya ha sido desbloqueado completamente.`,
        data: {
          username: defenderUsername,
          unlockCount: currentUnlocks,
          state: defenderUser.idUserProcessState === UserProcessStateId.READY_TO_ACCEPT ? 'READY_TO_ACCEPT' : 'UNKNOWN',
          maxUnlocks
        },
        error: {
          code: 'ALREADY_UNLOCKED',
          details: `El usuario ya tiene ${currentUnlocks} desbloqueos de ${maxUnlocks} permitidos.`
        }
      };
    }

    // 7. Verificar el estado actual del usuario
    if (defenderUser.idUserProcessState === UserProcessStateId.READY_TO_ACCEPT && currentUnlocks === maxUnlocks - 1) {
      return {
        success: false,
        message: `El usuario ${defenderUsername} ya está listo para aceptar.`,
        data: {
          username: defenderUsername,
          unlockCount: currentUnlocks,
          state: 'READY_TO_ACCEPT',
          maxUnlocks
        },
        error: {
          code: 'INVALID_STATE',
          details: 'El usuario ya está en estado READY_TO_ACCEPT'
        }
      };
    }

    // 8. Realizar el desbloqueo
    try {
      const newUnlockCount = currentUnlocks + 1;
      const newState = determineUserStateByUnlockCount(currentUnlocks, maxUnlocks);

      // Actualizar el usuario con el nuevo contador y estado
      await queryRunner.manager.update(EntityUser, 
        { id: defenderUser.id },
        { 
          unlockCount: newUnlockCount,
          idUserProcessState: newState
        }
      );

      // 🚨 NUEVA LÓGICA: Desbloquear el tablero objetivo
      console.log(`[unlockLowerLevelBoardGenericService] Desbloqueando tablero ${targetBoard.id} - cambiando estado de BLOCKED a WAITING`);
      
      await queryRunner.manager.update(Board,
        { id: targetBoard.id },
        {
          idBoardState: BoardStateNumericId.WAITING, // Cambiar a estado WAITING (1)
          currentBlockadeStage: null // Resetear etapa de bloqueo
        }
      );

      // Verificar que ambas actualizaciones fueron exitosas
      const [updatedUser, updatedTargetBoard] = await Promise.all([
        queryRunner.manager.findOne(EntityUser, {
        where: { id: defenderUser.id }
        }),
        queryRunner.manager.findOne(Board, {
          where: { id: targetBoard.id }
        })
      ]);

      if (!updatedUser || updatedUser.unlockCount !== newUnlockCount) {
        throw new Error('La actualización del usuario no se completó correctamente');
      }

      if (!updatedTargetBoard || updatedTargetBoard.idBoardState !== BoardStateNumericId.WAITING) {
        throw new Error('La actualización del tablero no se completó correctamente');
      }

      if (updatedTargetBoard.currentBlockadeStage !== null) {
        throw new Error('El reseteo de la etapa de bloqueo no se completó correctamente');
      }

      // Si todo fue exitoso, hacer commit
      await queryRunner.commitTransaction();

      console.log(`[unlockLowerLevelBoardGenericService] ✅ Desbloqueo completo exitoso:`);
      console.log(`  - Usuario ${defenderUsername}: unlockCount ${newUnlockCount}/${maxUnlocks}`);
      console.log(`  - Tablero ${targetBoard.id}: estado cambiado a WAITING, etapa reseteada`);

      const stateString = newState === UserProcessStateId.VALIDATING ? 'VALIDATING' : 'READY_TO_ACCEPT';

      return {
        success: true,
        message: `Desbloqueo ${newUnlockCount}/${maxUnlocks} realizado exitosamente para ${defenderUsername}`,
        data: {
          username: defenderUsername,
          unlockCount: newUnlockCount,
          state: stateString,
          maxUnlocks,
          targetBoardUnlocked: true,
          targetBoardId: targetBoard.id,
          targetBoardLevel: targetLevelId === 1 ? 'Génesis' : targetLevelId === 2 ? 'Armagedón' : targetLevelId === 3 ? 'Apolo' : 'Neptuno',
          targetBoardPreviousState: 'BLOCKED',
          targetBoardNewState: 'WAITING'
        }
      };

    } catch (updateError) {
      // Si hay error en la actualización, hacer rollback
      await queryRunner.rollbackTransaction();
      throw updateError;
    }

  } catch (error: unknown) {
    console.error("[unlockLowerLevelBoardGenericService] Error:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    if ((error as ArmageddonError).code) {
      const armageddonError = error as ArmageddonError;
      return {
        success: false,
        message: "Error al realizar el desbloqueo",
        error: armageddonError
      };
    }

    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return {
      success: false,
      message: `Error interno del servidor: ${errorMessage}`,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: errorMessage
      }
    };
  } finally {
    await queryRunner.release();
  }
};

// DEPRECATED: Mantener por compatibilidad, pero ahora usa el servicio genérico
export const unblockHalfArmageddonService = async (
  generalUserId: number,
  defenderUsername: string,
  boardId: number
): Promise<{
  success: boolean;
  message: string;
  data?: {
    username: string;
    unlockCount: number;
    state: string;
  };
  error?: ArmageddonError;
}> => {
  console.log(`[unblockHalfArmageddonService] DEPRECATED: Redirecting to unlockLowerLevelBoardGenericService`);
  
  const result = await unlockLowerLevelBoardGenericService(generalUserId, defenderUsername, boardId);
  
  // Adaptar la respuesta para mantener compatibilidad
  if (result.data) {
    const { maxUnlocks, ...compatibleData } = result.data;
    return {
      ...result,
      data: compatibleData
    };
  }
  
  return result;
};



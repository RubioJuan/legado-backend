import { In, Not, QueryRunner, UpdateResult } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { UpdateUserProfileRequest, User, UserExt, UserProfile } from "../interfaces/user.interface";
// ... otras importaciones
import { Association } from "../entities/association.entity"; // <--- AÑADE ESTO
// ...

//Entities
import { Board } from "../entities/board.entity";
import { Level as LevelEntity } from "../entities/level.entity";
import { PasswordResetTokens } from "../entities/password_reset_tokens.entity";
import { EntityUser } from "../entities/user.entity";

// Importaciones nuevas
import { IsNull } from "typeorm"; // IsNull es necesario para Not(IsNull())
import { BoardLevelNumericId, BoardStateNumericId, Role, UserProcessStateId } from "../types/enums.types"; // <<< Añadidos nuevos Enums

//Utils
import { AppDataSource } from "../config/db";
import { ServiceResponse } from "../interfaces/admin.request.interface";
import { encrypt, verified } from "../utils/bcrypt.handle";
import {
  getPositionAvailable,
  getPositionsAvailables,
} from "../utils/getPositionAvailable";
import { getPositionOfUser } from "../utils/getPositionOfUser";
import { getDefendersValidatingAndValidated } from "../utils/getValidatingAndValidated";
import { generateToken } from "../utils/jwt.handle";
import {
  closeBoardFinal,
  getBoardWaitingOfCaptain,
  getPositionBasedOnAssosiation,
  modifyBoardById,
} from "./board.service";
import {
  notificatePushCloseBoard,
  notificatePushSendBall,
} from "./notificationsPush.onesignal.service";

// Types
import { GetVerifyBoardMock, GetVerifyGoalScorerMock } from "../interfaces/mock.interface";
import { LoginUserData } from "../interfaces/user.interface";

export const checkUsername = async (username: string) => {
  try {
    if (username !== undefined) {
      const checkIs = await EntityUser.findOne({
        where: { username },
      });

      if (checkIs) {
        return true;
      } else {
        return false;
      }
    }

    return false;
  } catch (error) {
    return new Error(`${error}`);
  }
};

export const insertUser = async (userData: User) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      country,
      countryCode,
      password,
      username,
      acceptMarketing,
      beneficiatedNames,
      beneficiatedPhoneNumber,
      beneficiatedCountry,
      beneficiatedCountryCode,
      idCaptain,
      idUserProcessState,
      securityQuestion,
      securityAnswer,
      creatorUserId // <<< Extract creatorUserId
    } = userData;

    console.log("[insertUser] Received security data:", { securityQuestion, securityAnswer });
    console.log("[insertUser] Received creatorUserId:", creatorUserId);

    const passwordCryp = await encrypt(password);
    let securityAnswerHash: string | null = null;
    if (securityAnswer) {
      securityAnswerHash = await encrypt(securityAnswer!);
    }
    console.log("[insertUser] securityAnswerHash to be saved:", securityAnswerHash);

    const user = new EntityUser();

    user.firstName = firstName;
    user.lastName = lastName;
    user.phoneNumber = phoneNumber;
    user.country = country;
    user.countryCode = countryCode;
    user.password = passwordCryp;
    user.username = username;
    user.idUserProcessState = idUserProcessState || 1; // Default to 1 if not provided
    user.acceptMarketing = acceptMarketing || false;

    if (securityQuestion) {
      user.securityQuestion = securityQuestion;
    }
    if (securityAnswerHash) {
      user.securityAnswerHash = securityAnswerHash;
    }

    if (idCaptain !== undefined) {
      user.idCaptain = idCaptain;
    }

    // >>> START: Logic for assigning triplicationOfId <<<
    if (creatorUserId) {
      console.log(`[insertUser] Attempting to link to creatorUser ID: ${creatorUserId}`);
      // Find the creator's active Genesis board that is awaiting user creation
      const creatorBoard = await AppDataSource.manager.findOne(Board, {
        where: {
          idGoalScorer: creatorUserId,
          idLevelId: BoardLevelNumericId.GENESIS, // <<< CAMBIO AQUÍ
          isAwaitingUserCreation: true,
          currentBlockadeStage: 3 // Specifically for the 3rd blockade user creation
        }
      });

      if (creatorBoard) {
        user.triplicationOfId = creatorUserId;
        console.log(`[insertUser] New user ${username} will be linked to creator ${creatorUserId} (triplicationOfId) for board ${creatorBoard.id}.`);
      } else {
        console.log(`[insertUser] Creator user ${creatorUserId} does not have an active Genesis board in stage 3 awaiting user creation. New user will not be linked via triplicationOfId.`);
      }
    }
    // >>> END: Logic for assigning triplicationOfId <<<

    user.idRole = 2; // Default role, adjust if necessary

    user.idUserState = 1; // Default state, adjust if necessary

    const response = await user.save();

    return response;
  } catch (error) {
    console.error(error);
    return null;
    // return new Error(`Has been a error : ${error}`);
  }
};

export const searchUsers = async () => {
  const responseUsers = await EntityUser.find();
  return responseUsers;
};

export const searchUserById = async (id: number) => {
  const responseUser = await EntityUser.findOne({
    where: { id },
    relations: ["subscriptions", "subscriptions.board"]
  });
  return responseUser;
};

export const searchUserByIdWhitRelations = async (id: number) => {
  const responseUser = await EntityUser.findOne({
    where: { id },
    relations: ["idUserProcessState"],
  });

  return responseUser;
};

export const searchUserByUsername = async (username: string) => {
  // try {
  const responseUser = await EntityUser.findOne({
    where: { username },
    loadRelationIds: true,
    // relations: ["idUserState"],
    // loadEagerRelations: true,
    // select: { id: true, idUserState: true },
  });

  return responseUser;
  // } catch (error) {
  // console.error(error);
  // return error;
  // }
};

export const modifyUserById = async (
  id: number,
  userData: QueryDeepPartialEntity<EntityUser>
) => {
  const responseUser = await EntityUser.update({ id: In([id]) }, userData);
  return responseUser;
};

export const isUserInProcessOfValidating = (user: any) => {
  if (user.idUserProcessState.id === 3) {
    return true;
  }
  return false;
};

export const getIdUserProcessState = (user: UserExt | any): number => {
  return user.idUserProcessState?.id;
};

export const userPasswordRecovery = async (
  idUser: number,
  token: string,
  newPassword: string
) => {
  const passwordResetUser = await PasswordResetTokens.findOne({
    where: {
      idUser: In([idUser]),
      token,
    },
  });

  if (!passwordResetUser) {
    return "Token invalido";
  }

  const passwordCryp = await encrypt(newPassword);
  await EntityUser.update(idUser, { password: passwordCryp });
  await PasswordResetTokens.delete({ idUser });

  return "Contraseña modificada";
};

export const modifyAssosiationsOfUser = async (
  idUser: number, // ID del usuario que está siendo *colocado* en el tablero (ej. prueba2)
  positionOfPlayer: string,
  board: Board,
  queryRunner: QueryRunner // Asumimos que queryRunner siempre se pasará y es obligatorio para esta lógica transaccional
) => {
  if (!queryRunner) {
    console.error("[modifyAssosiationsOfUser] QueryRunner is undefined. Associations cannot be modified transactionally.");
    throw new Error("QueryRunner is required for modifying associations.");
  }

  let idUserToUpdateAssociation: number | null = null; // Usuario al que se le actualizará idLeftAssociation o idRightAssociation
  let associationSide: 'left' | 'right' | null = null;

  // Determinar a quién actualizar y qué lado de la asociación
  switch (positionOfPlayer) {
    case "idCreator1": // prueba2 (idUser) se coloca como idCreator1. Su "padre" es idGoalScorer (prueba1)
      idUserToUpdateAssociation = board.idGoalScorer ?? null;
      associationSide = 'left'; // prueba1 (GoalScorer) obtiene a prueba2 (idUser) en su asociación izquierda
      break;
    case "idCreator2":
      idUserToUpdateAssociation = board.idGoalScorer ?? null;
      associationSide = 'right'; // prueba1 (GoalScorer) obtiene a prueba2 (idUser) en su asociación derecha
      break;
    case "idGenerator1":
      idUserToUpdateAssociation = board.idCreator1 ?? null;
      associationSide = 'left';
      break;
    case "idGenerator2":
      idUserToUpdateAssociation = board.idCreator1 ?? null;
      associationSide = 'right';
      break;
    case "idGenerator3":
      idUserToUpdateAssociation = board.idCreator2 ?? null;
      associationSide = 'left';
      break;
    case "idGenerator4":
      idUserToUpdateAssociation = board.idCreator2 ?? null;
      associationSide = 'right';
      break;
    // Añade más casos si los defensores también forman asociaciones directas de esta manera
    default:
      console.log(`[modifyAssosiationsOfUser] Position ${positionOfPlayer} does not trigger association update.`);
      return; // No se hace nada si la posición no implica crear una asociación
  }

  if (idUserToUpdateAssociation !== null && associationSide !== null) {
    // 1. Crear la nueva entidad Association
    const newAssociation = new Association();
    // Aquí podrías establecer más propiedades en newAssociation si las tuviera,
    // por ejemplo, newAssociation.relatedUserId = idUser; para saber quién está en el otro lado.
    // Esto dependerá de cómo quieras usar la tabla 'associations'.
    // Por ahora, solo tendrá un ID auto-generado.
    
    console.log(`[modifyAssosiationsOfUser] Creating new association entry.`);
    const savedAssociation = await queryRunner.manager.save(Association, newAssociation); // Guarda usando el queryRunner
    const newAssociationId = savedAssociation.id;
    console.log(`[modifyAssosiationsOfUser] New association created with ID: ${newAssociationId}.`);

    // 2. Preparar la actualización para el usuario que recibe la asociación
    const updateData: QueryDeepPartialEntity<EntityUser> = {};
    if (associationSide === 'left') {
      updateData.idLeftAssociation = newAssociationId;
    } else {
      updateData.idRightAssociation = newAssociationId;
    }
    
    // También, el nuevo usuario (idUser) necesita la referencia a esta misma asociación en su lado opuesto.
    // Esto asume una relación bidireccional donde si A tiene a B en su izquierda, B tiene a A en su derecha.
    // Esta parte es una suposición de tu lógica, ajústala si es diferente.
    const updateDataForNewUser: QueryDeepPartialEntity<EntityUser> = {};
    if (associationSide === 'left') { // Si idUserToUpdateAssociation (prueba1) obtiene la asociación a su izquierda...
      updateDataForNewUser.idRightAssociation = newAssociationId; // ...entonces idUser (prueba2) obtiene la misma asociación a su derecha.
    } else { // Si idUserToUpdateAssociation (prueba1) obtiene la asociación a su derecha...
      updateDataForNewUser.idLeftAssociation = newAssociationId; // ...entonces idUser (prueba2) obtiene la misma asociación a su izquierda.
    }

    try {
      console.log(`[modifyAssosiationsOfUser] Updating user ${idUserToUpdateAssociation} with:`, updateData);
      await queryRunner.manager.update(EntityUser, { id: idUserToUpdateAssociation }, updateData);
      
      console.log(`[modifyAssosiationsOfUser] Updating new user ${idUser} with:`, updateDataForNewUser);
      await queryRunner.manager.update(EntityUser, { id: idUser }, updateDataForNewUser);

    } catch (error) {
      console.error(`[modifyAssosiationsOfUser] Error during association update for user ${idUserToUpdateAssociation} or ${idUser}:`, error);
      throw error; // Propaga para rollback
    }
  } else {
    console.log(`[modifyAssosiationsOfUser] No user to modify or association side not determined. User: ${idUserToUpdateAssociation}, Side: ${associationSide}`);
  }
};

export const validateAndUnlockGoalScorerFirstLevel = async (
  board: any,
  idDefender: number
) => {
  let idCaptainOfGoalScorer: number | null = null;
  if (board.idGoalScorer && typeof board.idGoalScorer === 'number') {
    const goalScorerUser = await EntityUser.findOne({ where: { id: board.idGoalScorer }, relations: ['idCaptain'] });
    if (goalScorerUser && goalScorerUser.idCaptain) {
         idCaptainOfGoalScorer = typeof goalScorerUser.idCaptain === 'object' 
                               ? (goalScorerUser.idCaptain as any).id 
                               : goalScorerUser.idCaptain;
    } else if (goalScorerUser && typeof goalScorerUser.idCaptain === 'number') {
        idCaptainOfGoalScorer = goalScorerUser.idCaptain;
    }
  } else if (board.idGoalScorer && typeof board.idGoalScorer === 'object' && board.idGoalScorer.idCaptain) {
    idCaptainOfGoalScorer = typeof board.idGoalScorer.idCaptain === 'object'
                          ? board.idGoalScorer.idCaptain.id
                          : board.idGoalScorer.idCaptain;
  }

  const idGoalScorer = board.idGoalScorer?.id ?? board.idGoalScorer;

  const currentLevelId = (board.idLevel as LevelEntity)?.id ?? (board.idLevel as number);
  if (typeof currentLevelId !== 'number') {
    console.error("[validateAndUnlockGoalScorerFirstLevel] Could not determine current level ID.");
    return "ERROR: No se pudo determinar el ID del nivel actual.";
  }
  const newLevel = currentLevelId + 1;

  if (!idCaptainOfGoalScorer) {
    const newBoardNextLevel = new Board();
    newBoardNextLevel.idBoardState = 1;
    newBoardNextLevel.idLevelId = newLevel as any;
    newBoardNextLevel.idGoalScorer = idGoalScorer;

    const board1 = await newBoardNextLevel.save();

    const response1 = await modifyUserById(idGoalScorer, {
      idUserProcessState: 2,
    });

    const response2 = await modifyUserById(idDefender, {
      idUserProcessState: 4,
    });

    if (
      board1 &&
      response1.affected !== undefined &&
      response1.affected > 0 &&
      response2.affected !== undefined &&
      response2.affected > 0
    ) {
      return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
    } else {
      return "ERROR WHILE VERIFICATE USER";
    }
  } else {
    const boardOfCaptain = await Board.findOne({
      where: {
        idGoalScorer: In([idCaptainOfGoalScorer]),
        idBoardState: In([1]),
        idLevelId: In([newLevel]),
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

    if (!boardOfCaptain)
      return "Error, no se pudo encontrar un tablero libre de nivel superior, comunícate con el administrador.";
    const positionForGoalScorer = getPositionBasedOnAssosiation(
      boardOfCaptain,
      idGoalScorer
    );

    if (!positionForGoalScorer)
      return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";
    const listOfPositions = getPositionsAvailables(boardOfCaptain);
    if (!listOfPositions)
      return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";

    let update: any = {};
    if (listOfPositions.length === 1) {
      update.idBoardState = 2;
    }
    update[`${positionForGoalScorer}`] = idGoalScorer;
    const response1 = await modifyBoardById(boardOfCaptain.id, update);
    const response2 = await modifyUserById(idDefender, {
      idUserProcessState: 4,
    });
    const response3 = await modifyUserById(idGoalScorer, {
      idUserProcessState: 2,
    });
    if (
      response1.affected !== undefined &&
      response1.affected > 0 &&
      response2.affected !== undefined &&
      response2.affected > 0 &&
      response3.affected !== undefined &&
      response3.affected > 0
    ) {
      return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
    } else {
      return "ERROR WHILE VERIFICATE USER";
    }
  }
};

export const validateAndUnlockGoalScorerSecondLevel = async (
  board: any,
  boardLockOfDefender: any,
  totalUsersValidated: number,
  totalDefendersValidated: number
) => {
  const defenderEntityFromLockBoard = boardLockOfDefender.idGoalScorer;
  if (!defenderEntityFromLockBoard) {
    console.error("[validateAndUnlockGoalScorerSecondLevel] Defender entity (GoalScorer) on lockBoard is null. Cannot proceed.");
    return "ERROR: El Defensor (Goleador en tablero bloqueado) no está presente.";
  }
  const idDefender = defenderEntityFromLockBoard.id;

  const goalScorerEntity = board.idGoalScorer;
  if (!goalScorerEntity) {
    console.error("[validateAndUnlockGoalScorerSecondLevel] GoalScorer entity on the current board is null. Cannot proceed.");
    return "ERROR: El Goleador no está presente en el tablero actual.";
  }
  const idGoalScorer = goalScorerEntity.id;

  const idCaptain = getIdCaptain(board);
  const currentLevelId = (board.idLevel as LevelEntity)?.id ?? (board.idLevel as number);
  if (typeof currentLevelId !== 'number') {
    console.error("[validateAndUnlockGoalScorerSecondLevel] Could not determine current level ID.");
    return "ERROR: No se pudo determinar el ID del nivel actual.";
  }
  const newLevel = currentLevelId + 1;

  if (!boardLockOfDefender)
    return "ERROR WHILE FIND BOARD OF GOALSCORER ON VALIDATION";

  if (
    (totalUsersValidated === 1 && !idCaptain) ||
    (totalDefendersValidated === 1 && idCaptain)
  ) {
    if (!idCaptain) {
      const newBoardNextLevel = new Board();
      newBoardNextLevel.idBoardState = 1;
      newBoardNextLevel.idLevelId = newLevel as any;
      newBoardNextLevel.idGoalScorer = goalScorerEntity;

      const board1 = await newBoardNextLevel.save();

      const response1 = await modifyUserById(idGoalScorer, {
        idUserProcessState: 2,
      });

      const response2 = await modifyUserById(idDefender, {
        idUserProcessState: 4,
      });

      const positionAvailable = getPositionAvailable(boardLockOfDefender);
      let response3;
      if (positionAvailable) {
        response3 = await modifyBoardById(boardLockOfDefender.id, {
          idBoardState: 1,
        });
      } else {
        response3 = await modifyBoardById(boardLockOfDefender.id, {
          idBoardState: 2,
        });
      }

      if (
        board1 &&
        response1.affected !== undefined &&
        response1.affected > 0 &&
        response2.affected !== undefined &&
        response2.affected > 0 &&
        response3.affected !== undefined &&
        response3.affected > 0
      ) {
        return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
      } else {
        return "ERROR WHILE VERIFICATE USER";
      }
    } else {
      const boardOfCaptain = await getBoardWaitingOfCaptain(
        idCaptain,
        newLevel
      );

      if (!boardOfCaptain)
        return "Error, no se pudo encontrar un tablero libre de nivel superior, comunícate con el administrador.";
      const positionForGoalScorer = getPositionBasedOnAssosiation(
        boardOfCaptain,
        idGoalScorer
      );

      if (!positionForGoalScorer)
        return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";
      const listOfPositions = getPositionsAvailables(boardOfCaptain);
      if (!listOfPositions)
        return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";
      let update: any = {};
      if (listOfPositions.length === 1) {
        update.idBoardState = 2;
      }
      update[`${positionForGoalScorer}`] = goalScorerEntity;
      const response1 = await modifyBoardById(boardOfCaptain.id, update);
      const response2 = await modifyUserById(idDefender, {
        idUserProcessState: 4,
      });
      const response3 = await modifyUserById(idGoalScorer, {
        idUserProcessState: 2,
      });
      const positionAvailable = getPositionAvailable(boardLockOfDefender);
      let response4;
      if (positionAvailable) {
        response4 = await modifyBoardById(boardLockOfDefender.id, {
          idBoardState: 1,
        });
      } else {
        response4 = await modifyBoardById(boardLockOfDefender.id, {
          idBoardState: 2,
        });
      }
      if (
        response1.affected !== undefined &&
        response1.affected > 0 &&
        response2.affected !== undefined &&
        response2.affected > 0 &&
        response3.affected !== undefined &&
        response3.affected > 0 &&
        response4.affected !== undefined &&
        response4.affected > 0
      ) {
        return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
      } else {
        return "ERROR WHILE VERIFICATE USER";
      }
    }
  }

  if (!(totalUsersValidated % 2 === 0) || totalDefendersValidated === 6) {
    const response1 = await modifyUserById(idGoalScorer, {
      idUserProcessState: 2,
    });
    const response2 = await modifyUserById(idDefender, {
      idUserProcessState: 4,
    });
    const positionAvailable = getPositionAvailable(boardLockOfDefender);
    let response3;
    if (positionAvailable) {
      response3 = await modifyBoardById(boardLockOfDefender.id, {
        idBoardState: 1,
      });
    } else {
      response3 = await modifyBoardById(boardLockOfDefender.id, {
        idBoardState: 2,
      });
    }
    if (
      response1.affected !== undefined &&
      response1.affected > 0 &&
      response2.affected !== undefined &&
      response2.affected > 0 &&
      response3.affected !== undefined &&
      response3.affected > 0
    ) {
      return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
    } else {
      return "ERROR WHILE VERIFICATE USER";
    }
  }

  return "LOGIC ERROR";
};

export const validateIfUnlockGoalScorerLevel3 = async (
  board: any,
  boardDefender: any,
  defender: any,
  defendersValidated: number
) => {
  const idCaptain = getIdCaptain(board);
  const { ballsSended } = defender;
  
  const goalScorerEntity = board.idGoalScorer;
  if (!goalScorerEntity) {
    console.error("[validateIfUnlockGoalScorerLevel3] GoalScorer entity on the current board is null. Cannot proceed.");
    return "ERROR: El Goleador no está presente en el tablero actual.";
  }
  const { ballsReceivedConfirmed, id: idGoalScorer } = goalScorerEntity;

  const idDefender = defender.id;
  const idBoardDefender = boardDefender.id;
  const currentLevelId = (board.idLevel as LevelEntity)?.id ?? (board.idLevel as number);
  if (typeof currentLevelId !== 'number') {
    console.error("[validateIfUnlockGoalScorerLevel3] Could not determine current level ID.");
    return "ERROR: No se pudo determinar el ID del nivel actual.";
  }
  const newLevel = currentLevelId + 1;
  
  const updateForDefender: any = {};
  const updateForGoalScorer: any = {};
  const updateBoardOfDefender: any = {};

  if (ballsReceivedConfirmed === 1) {
    if (!idCaptain) {
      const newBoardNextLevel = new Board();
      newBoardNextLevel.idBoardState = 1;
      newBoardNextLevel.idLevelId = newLevel as any;
      newBoardNextLevel.idGoalScorer = goalScorerEntity;

      const positionAvailable = getPositionAvailable(boardDefender);
      if (!!positionAvailable) {
        updateBoardOfDefender.idBoardState = 1;
      } else {
        updateBoardOfDefender.idBoardState = 2;
      }

      if (defender.ballsSended === 3) {
        updateForDefender.idUserProcessState = 4;
        updateForDefender.ballsSended = 0;
      } else {
        updateForDefender.idUserProcessState = 1;
        updateForDefender.ballsSended = ballsSended + 1;
      }

      updateForGoalScorer.idUserProcessState = 2;
      updateForGoalScorer.ballsReceivedConfirmed = ballsReceivedConfirmed + 1;

      const board1 = await newBoardNextLevel.save();

      const responseUpdateBoardOfDefender = await modifyBoardById(
        idBoardDefender,
        updateBoardOfDefender
      );

      const responseUpdateDefender = await modifyUserById(
        idDefender,
        updateForDefender
      );

      const responseUpdateGoalScorer = await modifyUserById(
        idGoalScorer,
        updateForGoalScorer
      );

      if (
        !!board1 &&
        !!responseUpdateBoardOfDefender.affected &&
        responseUpdateBoardOfDefender.affected > 0 &&
        !!responseUpdateDefender.affected &&
        responseUpdateDefender.affected > 0 &&
        !!responseUpdateGoalScorer.affected &&
        responseUpdateGoalScorer.affected > 0
      ) {
        await notificatePushSendBall(board.idGoalScorer, defender);

        return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
      } else {
        return "ERROR WHILE VERIFICATE USER";
      }
    } else {
      let updateBoardOfCaptain: any = {};

      const boardOfCaptain = await getBoardWaitingOfCaptain(
        idCaptain,
        newLevel
      );

      if (!boardOfCaptain) {
        console.error("[validateIfUnlockGoalScorerLevel3] No boardOfCaptain found.");
        return "Error, no se pudo encontrar un tablero libre de nivel superior, comunícate con el administrador.";
      }

      const positionForGoalScorer = getPositionBasedOnAssosiation(
        boardOfCaptain,
        idGoalScorer
      );

      if (!positionForGoalScorer) {
        console.error("[validateIfUnlockGoalScorerLevel3] No positionForGoalScorer found.");
        return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";
      }

      const listOfPositions = getPositionsAvailables(boardOfCaptain);
      if (!listOfPositions) {
        console.error("[validateIfUnlockGoalScorerLevel3] No listOfPositions found on captain board.");
        return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, LIST OF POSITIONS NOT FOUND";
      }

      const positionAvailable = getPositionAvailable(boardDefender);
      if (positionAvailable) {
        updateBoardOfDefender.idBoardState = 1;
      } else {
        updateBoardOfDefender.idBoardState = 2;
      }

      if (ballsSended === 3) {
        updateForDefender.idUserProcessState = 4;
        updateForDefender.ballsSended = 0;
      } else {
        updateForDefender.idUserProcessState = 1;
        updateForDefender.ballsSended = ballsSended + 1;
      }

      updateBoardOfCaptain[`${positionForGoalScorer}`] = goalScorerEntity;
      if (listOfPositions.length === 1) {
        updateBoardOfCaptain.idBoardState = 2;
      }

      updateForGoalScorer.idUserProcessState = 2;
      updateForGoalScorer.ballsReceivedConfirmed = ballsReceivedConfirmed + 1;

      const responseUpdateBoardOfDefender = await modifyBoardById(
        idBoardDefender,
        updateBoardOfDefender
      );

      const responseUpdateDefender = await modifyUserById(
        idDefender,
        updateForDefender
      );

      const responseUpdateBoardOfCaptain = await modifyBoardById(
        boardOfCaptain.id,
        updateBoardOfCaptain
      );

      const responseUpdateGoalScorer = await modifyUserById(
        idGoalScorer,
        updateForGoalScorer
      );

      if (
        !!responseUpdateBoardOfDefender.affected &&
        responseUpdateBoardOfDefender.affected > 0 &&
        !!responseUpdateDefender.affected &&
        responseUpdateDefender.affected > 0 &&
        !!responseUpdateBoardOfCaptain.affected &&
        responseUpdateBoardOfCaptain.affected > 0 &&
        !!responseUpdateGoalScorer.affected &&
        responseUpdateGoalScorer.affected > 0
      ) {
        await notificatePushSendBall(board.idGoalScorer, defender);

        return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
      } else {
        return "ERROR WHILE VERIFICATE USER";
      }
    }
  }

  if (
    (!idCaptain &&
      ballsReceivedConfirmed <= 52 &&
      (!(ballsReceivedConfirmed % 2 === 0) || ballsReceivedConfirmed === 52)) ||
    (!!idCaptain &&
      ballsReceivedConfirmed <= 28 &&
      (!(ballsReceivedConfirmed % 2 === 0) || ballsReceivedConfirmed === 28))
  ) {
    const positionAvailable = getPositionAvailable(boardDefender);
    if (!!positionAvailable) {
      updateBoardOfDefender.idBoardState = 1;
    } else {
      updateBoardOfDefender.idBoardState = 2;
    }

    if (ballsSended === 3) {
      updateForDefender.idUserProcessState = 4;
      updateForDefender.ballsSended = 0;
      defendersValidated = defendersValidated + 1;
    } else {
      updateForDefender.idUserProcessState = 1;
      updateForDefender.ballsSended = ballsSended + 1;
    }

    updateForGoalScorer.idUserProcessState = 2;
    updateForGoalScorer.ballsReceivedConfirmed = ballsReceivedConfirmed + 1;

    const responseUpdateBoardOfDefender = await modifyBoardById(
      idBoardDefender,
      updateBoardOfDefender
    );

    const responseUpdateDefender = await modifyUserById(
      idDefender,
      updateForDefender
    );

    const responseUpdateGoalScorer = await modifyUserById(
      idGoalScorer,
      updateForGoalScorer
    );

    if (
      !!responseUpdateBoardOfDefender.affected &&
      responseUpdateBoardOfDefender.affected > 0 &&
      !!responseUpdateDefender.affected &&
      responseUpdateDefender.affected > 0 &&
      !!responseUpdateGoalScorer.affected &&
      responseUpdateGoalScorer.affected > 0
    ) {
      await notificatePushSendBall(board.idGoalScorer, defender);

      return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
    } else {
      return "ERROR WHILE VERIFICATE USER";
    }
  }

  const positionAvailable = getPositionAvailable(boardDefender);
  if (!!positionAvailable) {
    updateBoardOfDefender.idBoardState = 1;
  } else {
    updateBoardOfDefender.idBoardState = 2;
  }

  if (ballsSended === 3) {
    updateForDefender.idUserProcessState = 4;
    updateForDefender.ballsSended = 0;
    defendersValidated = defendersValidated + 1;
  } else {
    updateForDefender.idUserProcessState = 1;
    updateForDefender.ballsSended = ballsSended + 1;
  }

  updateForGoalScorer.ballsReceivedConfirmed = ballsReceivedConfirmed + 1;

  const responseUpdateBoardOfDefender = await modifyBoardById(
    idBoardDefender,
    updateBoardOfDefender
  );

  const responseUpdateDefender = await modifyUserById(
    idDefender,
    updateForDefender
  );

  const responseUpdateGoalScorer = await modifyUserById(
    idGoalScorer,
    updateForGoalScorer
  );

  if (defendersValidated === 8) {
    const responseCloseBoard = await closeBoardFinal(board);
    if (
      !!responseUpdateBoardOfDefender.affected &&
      responseUpdateBoardOfDefender.affected > 0 &&
      !!responseUpdateDefender.affected &&
      responseUpdateDefender.affected > 0 &&
      responseCloseBoard === "BOARD CLOSED"
    ) {
      await notificatePushCloseBoard(board);

      return "Éxito, el tablero ha sido cerrado.";
    } else {
      return "ERROR WHILE CLOSE BOARD";
    }
  }

  if (
    !!responseUpdateBoardOfDefender.affected &&
    responseUpdateBoardOfDefender.affected > 0 &&
    !!responseUpdateDefender.affected &&
    responseUpdateDefender.affected > 0 &&
    !!responseUpdateGoalScorer.affected &&
    responseUpdateGoalScorer.affected > 0
  ) {
    await notificatePushSendBall(board.idGoalScorer, defender);

    return "Éxito, el jugador ha sido verificado.";
  } else {
    return "ERROR WHILE VERIFICATE USER";
  }
};

export const validateAndUnlockGoalScorer = async (
  board: any,
  totalVerified: number,
  idGoalScorer: number,
  idDefender: number
) => {
  const idCaptain = getIdCaptain(board);
  const newLevel = board.idLevelId + 1;
  if (board.idLevelId === 1) {
    if (!idCaptain) {
      const newBoardNextLevel = new Board();
      newBoardNextLevel.idBoardState = 1;
      newBoardNextLevel.idLevelId = newLevel;
      newBoardNextLevel.idGoalScorer = board.idGoalScorer.id;

      const board1 = await newBoardNextLevel.save();

      const response1 = await modifyUserById(idGoalScorer, {
        idUserProcessState: 2,
      });

      const response2 = await modifyUserById(idDefender, {
        idUserProcessState: 4,
      });

      if (
        board1 &&
        response1.affected !== undefined &&
        response1.affected > 0 &&
        response2.affected !== undefined &&
        response2.affected > 0
      ) {
        return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
      } else {
        return "ERROR WHILE VERIFICATE USER";
      }
    } else {
      const boardOfCaptain = await Board.findOne({
        where: {
          idGoalScorer: In([idCaptain]),
          idBoardState: In([1]),
          idLevelId: In([newLevel]),
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

      if (!boardOfCaptain)
        return "Error, no se pudo encontrar un tablero libre de nivel superior, comunícate con el administrador.";
      const positionForGoalScorer = getPositionBasedOnAssosiation(
        boardOfCaptain,
        board.idGoalScorer.id
      );

      if (!positionForGoalScorer)
        return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";
      const listOfPositions = getPositionsAvailables(boardOfCaptain);
      if (!listOfPositions)
        return "FATAL ERROR!! YOU CAN'T MOVE FORWARD, POSITION FOR GOALSCORER NOT FOUND";
      let update: any = {};
      update[`${positionForGoalScorer}`] = board.idGoalScorer.id;
      const response1 = await modifyBoardById(boardOfCaptain.id, update);
      const response2 = await modifyUserById(idDefender, {
        idUserProcessState: 4,
      });
      const response3 = await modifyUserById(idGoalScorer, {
        idUserProcessState: 2,
      });
      if (
        response1.affected !== undefined &&
        response1.affected > 0 &&
        response2.affected !== undefined &&
        response2.affected > 0 &&
        response3.affected !== undefined &&
        response3.affected > 0
      ) {
        return "Éxito, ahora deberías enviar tu balón al goleador del nivel superior.";
      } else {
        return "ERROR WHILE VERIFICATE USER";
      }
    }
  } else {
    const boardOfGoalScorer = await Board.findOne({
      where: {
        idBoardState: In([3]),
        idGoalScorer: In([idDefender]),
        idLevelId: In([(board.idLevelId as number) - 1]),
      },
      relations: [
        // "idLevel",
        // "idBoardState",
        // "idGoalScorer",
        // "idCreator1",
        // "idCreator2",
        // "idGenerator1",
        // "idGenerator2",
        // "idGenerator3",
        // "idGenerator4",
        // "idDefender1.idUserProcessState",
        // "idDefender2.idUserProcessState",
        // "idDefender3.idUserProcessState",
        // "idDefender4.idUserProcessState",
        // "idDefender5.idUserProcessState",
        // "idDefender6.idUserProcessState",
        // "idDefender7.idUserProcessState",
        // "idDefender8.idUserProcessState",
      ],
    });
    if (!boardOfGoalScorer)
      return "ERROR WHILE FIND BOARD OF GOALSCORER ON VALIDATION";

    const usersValidatingAndValidated =
      getDefendersValidatingAndValidated(boardOfGoalScorer);
    if (!usersValidatingAndValidated)
      return "ERROR GETING TOTAL OF VALIDATES ON BEFORE LEVEL";

    const positionAvailable = getPositionAvailable(boardOfGoalScorer);
    let responseChangeStateOfDefense: UpdateResult;
    let responseChangeStateOfBoard: UpdateResult;

    if (usersValidatingAndValidated.validated === 6) {
      responseChangeStateOfDefense = await modifyUserById(idDefender, {
        idUserProcessState: 4,
      });
    } else {
      responseChangeStateOfDefense = await modifyUserById(idDefender, {
        idUserProcessState: 1,
      });
    }

    if (positionAvailable) {
      responseChangeStateOfBoard = await modifyBoardById(boardOfGoalScorer.id, {
        idBoardState: 1,
      });
    } else {
      responseChangeStateOfBoard = await modifyBoardById(boardOfGoalScorer.id, {
        idBoardState: 2,
      });
    }

    if (
      responseChangeStateOfDefense.affected !== undefined &&
      responseChangeStateOfDefense.affected > 0 &&
      responseChangeStateOfBoard.affected !== undefined &&
      responseChangeStateOfBoard.affected > 0
    ) {
      return "Éxito, el jugador ha sido verificado.";
    } else {
      return "ERROR WHILE UPDATE DATA OF USERS";
    }
  }
};

export const getIdCaptain = (board: Board): number | null => {
  console.warn("[Deprecation Warning/Review Needed] getIdCaptain is called with a Board object where idGoalScorer is likely an ID. This function may not return the intended value and needs refactoring to fetch the user's idCaptain if needed based on board.idGoalScorer ID.");
    return null;
};

export const getBoardLevelId = (board: any): number | null => {
  if (board?.idLevel?.id) {
    return board?.idLevel?.id;
  } else {
    return null;
  }
};

export const isCaptain = (board: Board, idUser: number): boolean => {
  return getIdCaptain(board) === idUser;
};

export const eraseUserService = async (
  userToDeleteId: number
): Promise<{ message: string; status: number }> => {
  // create a new query runner
  const queryRunner = AppDataSource.createQueryRunner();

  // establish real database connection using our new query runner
  await queryRunner.connect();

  // lets now open a new transaction:
  await queryRunner.startTransaction();

  try {
    // execute some operations on this transaction:
    const userToDelete = await queryRunner.manager.findOne(EntityUser, {
      where: { id: In([userToDeleteId]) },
      // relations: ["idCaptain"],
      loadRelationIds: true,
    });

    if (!userToDelete)
      return { message: "Usuario a eliminar no encontrado.", status: 404 };

    if (!!userToDelete.triplicationOfId)
      return {
        message: "No se puede eliminar una triplicación.",
        status: 400,
      };
    // return userToDelete;

    // const captainId = getCaptainId(userToDelete);

    const captainId = userToDelete.idCaptain;
    if (typeof captainId !== 'number') {
      // This happens if the user has no captain or if idCaptain wasn't loaded correctly
      return { message: "No se pudo determinar el capitán del usuario a eliminar.", status: 400 };
    }

    // MODIFIED: Load full relations again for getPositionOfUser
    const boardToUpdate = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: In([captainId]),
        idLevelId: In([1]), // CORRECTED
        idBoardState: Not(In([4])), // MODIFIED
      },
      // loadRelationIds: true, // OLD Load only IDs
      relations: ["idGoalScorer", "idCreator1", "idCreator2", "idGenerator1", "idGenerator2", "idGenerator3", "idGenerator4", "idDefender1", "idDefender2", "idDefender3", "idDefender4", "idDefender5", "idDefender6", "idDefender7", "idDefender8", "idLevelId", "idBoardState"], // MODIFIED: Load full entities
    });

    if (!boardToUpdate)
      return {
        message: "No se encontró el campo de juego del goleador.",
        status: 404,
      };

    const positionOfUser = getPositionOfUser(userToDeleteId, boardToUpdate);

    if (
      !positionOfUser ||
      positionOfUser === "idGoalScorer" ||
      positionOfUser === "idCreator1" ||
      positionOfUser === "idCreator2" ||
      positionOfUser === "idGenerator1" ||
      positionOfUser === "idGenerator2" ||
      positionOfUser === "idGenerator3" ||
      positionOfUser === "idGenerator4"
    )
      return {
        message: "No se encontró una posición valida para eliminar el usuario.",
        status: 400,
      };

    if (userToDelete!.idUserProcessState === 4)
      return {
        message:
          "El usuario ya se encuentra validado, no es posible eliminarlo.",
        status: 400,
      };

    let updateBoard: QueryDeepPartialEntity<Board> = {};

    updateBoard[positionOfUser] = null;

    if (boardToUpdate.idBoardState !== 3) {
      updateBoard.idBoardState = 1;
    }

    const associated = await queryRunner.manager.findOne(EntityUser, {
      where: [
        { idLeftAssociation: In([userToDeleteId]) },
        { idRightAssociation: In([userToDeleteId]) },
      ],
      loadRelationIds: true,
    });

    if (!associated)
      return { message: "No se encontró el asosiado superior.", status: 400 };

    let updateAssosisated: QueryDeepPartialEntity<EntityUser> = {};

    if (associated!.idLeftAssociation === userToDeleteId) {
      updateAssosisated.idLeftAssociation = null;
    }

    if (associated!.idRightAssociation === userToDeleteId) {
      updateAssosisated.idRightAssociation = null;
    }

    await queryRunner.manager.update(
      EntityUser,
      { id: associated!.id },
      updateAssosisated
    );

    await queryRunner.manager.update(
      Board,
      {
        id: boardToUpdate!.id,
      },
      updateBoard
    );

    await queryRunner.manager.delete(EntityUser, { id: userToDeleteId });

    await queryRunner.commitTransaction();

    return { message: "Usuario eliminado", status: 200 };
  } catch (err) {
    await queryRunner.rollbackTransaction();

    return { message: `Se ha producido un error ${err}`, status: 500 };
  } finally {
    await queryRunner.release();
  }
};

export const eraseUserByUsernameService = async (
  username: string,
  goalScorerUsername?: string
): Promise<{ message: string; status: number }> => {
  // create a new query runner
  const queryRunner = AppDataSource.createQueryRunner();

  // establish real database connection using our new query runner
  await queryRunner.connect();

  // lets now open a new transaction:
  await queryRunner.startTransaction();

  try {
    // execute some operations on this transaction:
    let userToDeleteId: number;
    let userToDelete;

    if (!!goalScorerUsername) {
      const goalScorer = await queryRunner.manager.findOne(EntityUser, {
        where: {
          username: goalScorerUsername,
        },
      });

      if (!goalScorer) throw new Error("Goleador no encontrado.");

      userToDelete = await queryRunner.manager.findOne(EntityUser, {
        where: { username, idCaptain: In([goalScorer.id]) },
        loadRelationIds: true,
      });
    } else {
      userToDelete = await queryRunner.manager.findOne(EntityUser, {
        where: { username },
        loadRelationIds: true,
      });
    }

    if (!userToDelete) throw new Error("Usuario a eliminar no encontrado.");

    // const captainId = userToDelete!.idCaptain!; // OLD
    const captainId = userToDelete.idCaptain; // MODIFIED: Should be number | null
    if (typeof captainId !== 'number') {
      throw new Error("No se pudo determinar el capitán del usuario a eliminar.");
    }
    userToDeleteId = userToDelete.id;

    // MODIFIED: Load full relations
    const boardToUpdate = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: In([captainId]),
        idLevelId: In([1]), // CORRECTED
        idBoardState: Not(In([4])), // MODIFIED
      },
      // relations: ["idGoalScorer", ..., "idBoardState"], // OLD Load full entities
      relations: ["idGoalScorer", "idCreator1", "idCreator2", "idGenerator1", "idGenerator2", "idGenerator3", "idGenerator4", "idDefender1", "idDefender2", "idDefender3", "idDefender4", "idDefender5", "idDefender6", "idDefender7", "idDefender8", "idLevelId", "idBoardState"], // MODIFIED: Load full entities
    });

    if (!boardToUpdate)
      throw new Error("No se encontró el campo de juego del goleador.");

    const positionOfUser = getPositionOfUser(userToDeleteId, boardToUpdate);

    if (
      !positionOfUser ||
      positionOfUser === "idGoalScorer" ||
      positionOfUser === "idCreator1" ||
      positionOfUser === "idCreator2" ||
      positionOfUser === "idGenerator1" ||
      positionOfUser === "idGenerator2" ||
      positionOfUser === "idGenerator3" ||
      positionOfUser === "idGenerator4"
    )
      throw new Error(
        "No se encontró una posición valida para eliminar el usuario."
      );

    if (userToDelete!.idUserProcessState === 4)
      throw new Error(
        "El usuario ya se encuentra validado, no es posible eliminarlo."
      );

    let updateBoard: QueryDeepPartialEntity<Board> = {};

    updateBoard[positionOfUser] = null;

    if (boardToUpdate.idBoardState !== 3) {
      updateBoard.idBoardState = 1;
    }

    const associated = await queryRunner.manager.findOne(EntityUser, {
      where: [
        { idLeftAssociation: In([userToDeleteId]) },
        { idRightAssociation: In([userToDeleteId]) },
      ],
      loadRelationIds: true,
    });

    if (!associated) throw new Error("No se encontró el asosiado superior.");

    let updateAssosisated: QueryDeepPartialEntity<EntityUser> = {};

    if (associated!.idLeftAssociation === userToDeleteId) {
      updateAssosisated.idLeftAssociation = null;
    }

    if (associated!.idRightAssociation === userToDeleteId) {
      updateAssosisated.idRightAssociation = null;
    }

    await queryRunner.manager.update(
      EntityUser,
      { id: associated!.id },
      updateAssosisated
    );

    await queryRunner.manager.update(
      Board,
      {
        id: boardToUpdate!.id,
      },
      updateBoard
    );

    await queryRunner.manager.delete(EntityUser, { id: userToDeleteId });

    await queryRunner.commitTransaction();

    return { message: "Usuario eliminado", status: 200 };
  } catch (err) {
    await queryRunner.rollbackTransaction();

    return { message: `Se ha producido un error ${err}`, status: 500 };
  } finally {
    await queryRunner.release();
  }
};
export const getRoleOfUserByUsername = async (
  userId: number
): Promise<Role> => {
  try {
    const userData = await EntityUser.findOne({
      where: {
        id: userId,
      },
      loadRelationIds: true,
    });

    if (userData!.idRole === 1) {
      return Role.ADMINISTRATOR;
    } else {
      return Role.PLAYER;
    }
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const readUserByUsername = async (
  queryRunner: QueryRunner,
  username: string
) => {
  try {
    const user = await queryRunner.manager.findOne(EntityUser, {
      where: {
        username,
      },
      loadRelationIds: true,
    });

    return user;
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const adminLoginService = async (
  username: string,
  password: string
): Promise<ServiceResponse> => {
  try {
    const userData = await EntityUser.findOne({
      where: {
        username,
      },
      loadRelationIds: true,
    });

    if (!userData) return { message: "Usuario no existe.", status: 400 };

    if (userData.idRole !== 1)
      return { message: "Permisos insuficentes.", status: 401 };

    const passwordCrypt = userData.password;

    const isCorrect = await verified(password, passwordCrypt);

    if (!isCorrect) return { message: "Contraseña incorrecta.", status: 400 };

    const token = generateToken({
      id: userData.id,
      role: Role.ADMINISTRATOR,
      username: userData.username,
    });

    return { message: token, status: 200 };
  } catch (error) {
    throw new Error(`Ocurrio un error ${error}`);
  }
};

export const changePasswordByUsernameService = async (
  username: string,
  newPassword: string
): Promise<ServiceResponse> => {
  try {
    const userData = await EntityUser.findOne({
      where: {
        username,
      },
    });

    if (!userData)
      return { message: `No se encontró el usuario ${username}.`, status: 400 };

    const password = await encrypt(newPassword);

    EntityUser.update(
      { id: In([userData.id]) },
      {
        password,
      }
    );

    return {
      message: "Se ha realizado el cambio de contraseña exitosamente.",
      status: 200,
    };
  } catch (error) {
    throw new Error(`Ocurrio un error ${error}.`);
  }
};

export const findUserByEmail = async (
  queryRunner: QueryRunner,
  email: string // Assuming username is used as email for login
): Promise<EntityUser | null> => {
  try {
    const user = await queryRunner.manager.findOne(EntityUser, {
      where: { username: email }, // Uses username field as email
    });
    return user;
  } catch (error) {
    console.error("[UserService - findUserByEmail] Error:", error);
    throw error; // Re-throw to be handled by the calling service
  }
};

export const findUserByResetToken = async (
  queryRunner: QueryRunner,
  hashedResetToken: string
): Promise<EntityUser | null> => {
  try {
    const user = await queryRunner.manager.findOne(EntityUser, {
      where: {
        passwordResetToken: hashedResetToken,
        // passwordResetExpires should be checked in the auth.service.ts to provide a specific message
      },
    });
    return user;
  } catch (error) {
    console.error("[UserService - findUserByResetToken] Error:", error);
    throw error;
  }
};

export const unlockFirstBlockadeGeneral = async (
  primaryBlockedBoard: Board,
  actingGeneralUser: EntityUser,
  targetRecruitUser: EntityUser, // El General-Recluta en el tablero secundario
  queryRunner: QueryRunner
): Promise<{ unlocked: boolean; message: string }> => {
  console.log(
    '[unlockFirstBlockadeGeneral] Called',
    {
      primaryBoardId: primaryBlockedBoard.id,
      currentBlockadeStage: primaryBlockedBoard.currentBlockadeStage,
      actingGeneralUserId: actingGeneralUser.id,
      targetRecruitUserId: targetRecruitUser.id
    }
  );

  // Este desbloqueo es para la etapa 1
  if (primaryBlockedBoard.currentBlockadeStage === 1) {
    // La acción de "aceptar la mitad" se considera implícita por la llamada a esta función
    // en el contexto correcto (General del siguiente tablero actuando sobre el General-Recluta).
    // La función resolveBoardBlockadeBySecondaryAction se encargará de actualizar primaryBlockedBoard.currentBlockadeStage a null.
    return {
      unlocked: true,
      message: `Primer bloqueo (etapa 1) del tablero ${primaryBlockedBoard.id} resuelto por el general ${actingGeneralUser.username} para el recluta ${targetRecruitUser.username}.`
    };
  } else {
    return {
      unlocked: false,
      message: `El tablero ${primaryBlockedBoard.id} no está en la etapa de bloqueo 1 (actual: ${primaryBlockedBoard.currentBlockadeStage}), no se puede aplicar el primer desbloqueo.`
    };
  }
};

export const unlockSecondBlockadeGeneral = async (
  primaryBlockedBoard: Board,
  actingGeneralUser: EntityUser,
  targetRecruitUser: EntityUser, // El General-Recluta en el tablero secundario
  queryRunner: QueryRunner
): Promise<{ unlocked: boolean; message: string }> => {
  console.log(
    '[unlockSecondBlockadeGeneral] Called',
    {
      primaryBoardId: primaryBlockedBoard.id,
      currentBlockadeStage: primaryBlockedBoard.currentBlockadeStage,
      actingGeneralUserId: actingGeneralUser.id,
      targetRecruitUserId: targetRecruitUser.id
    }
  );

  // Este desbloqueo es para la etapa 2
  if (primaryBlockedBoard.currentBlockadeStage === 2) {
    // La acción de "aceptar todo" se considera implícita por la llamada a esta función
    // en el contexto correcto.
    return {
      unlocked: true,
      message: `Segundo bloqueo (etapa 2) del tablero ${primaryBlockedBoard.id} resuelto por el general ${actingGeneralUser.username} para el recluta ${targetRecruitUser.username}.`
    };
  } else {
    return {
      unlocked: false,
      message: `El tablero ${primaryBlockedBoard.id} no está en la etapa de bloqueo 2 (actual: ${primaryBlockedBoard.currentBlockadeStage}), no se puede aplicar el segundo desbloqueo.`
    };
  }
};

export const unlockThirdBlockadeGeneralArmageddonApolo = async (
  primaryBlockedBoard: Board,
  actingGeneralUser: EntityUser,
  targetRecruitUser: EntityUser, // El General-Recluta en el tablero secundario
  queryRunner: QueryRunner
): Promise<{ unlocked: boolean; message: string }> => {
  console.log(
    '[unlockThirdBlockadeGeneralArmageddonApolo] Called',
    {
      primaryBoardId: primaryBlockedBoard.id,
      currentBlockadeStage: primaryBlockedBoard.currentBlockadeStage,
      actingGeneralUserId: actingGeneralUser.id,
      targetRecruitUserId: targetRecruitUser.id,
      boardLevelId: primaryBlockedBoard.idLevelId // For context
    }
  );

  // Este desbloqueo es para la etapa 3 en Armagedón y Apolo
  if (primaryBlockedBoard.currentBlockadeStage === 3) {
    // La acción de "aceptar la mitad" se considera implícita.
    return {
      unlocked: true,
      message: `Tercer bloqueo (etapa 3) del tablero ${primaryBlockedBoard.id} resuelto por el general ${actingGeneralUser.username} para el recluta ${targetRecruitUser.username}.`
    };
  } else {
    return {
      unlocked: false,
      message: `El tablero ${primaryBlockedBoard.id} no está en la etapa de bloqueo 3 (actual: ${primaryBlockedBoard.currentBlockadeStage}), no se puede aplicar el tercer desbloqueo de Armagedón/Apolo.`
    };
  }
};

export const resolveBoardBlockadeBySecondaryAction = async (
  actingGeneralId: number,
  recruitBoardId: number,
  targetRecruitUserId: number
): Promise<{ message: string; status: number }> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log(`[resolveBoardBlockadeBySecondaryAction] Iniciando con:`);
    console.log(`- actingGeneralId: ${actingGeneralId}`);
    console.log(`- recruitBoardId: ${recruitBoardId}`);
    console.log(`- targetRecruitUserId: ${targetRecruitUserId}`);

    // 1. Verificar que el general actuante sea realmente general del tablero del recluta
    const actingGeneralBoard = await queryRunner.manager.findOne(Board, {
      where: { 
        id: recruitBoardId,
        idGoalScorer: actingGeneralId
      }
    });

    if (!actingGeneralBoard) {
      await queryRunner.rollbackTransaction();
      return { 
        message: "El usuario no es general del tablero indicado.", 
        status: 403 
      };
    }

    // 2. Verificar que el usuario recluta tenga un tablero principal bloqueado
    const targetRecruitUser = await queryRunner.manager.findOne(EntityUser, {
      where: { id: targetRecruitUserId }
    });

    if (!targetRecruitUser) {
      await queryRunner.rollbackTransaction();
      return { 
        message: "Usuario recluta no encontrado.", 
        status: 404 
      };
    }

    // 3. Buscar un tablero donde el usuario recluta sea general y tenga un bloqueo
    const primaryBlockedBoard = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: targetRecruitUserId,
        currentBlockadeStage: Not(IsNull())
      }
    });

    if (!primaryBlockedBoard) {
      await queryRunner.rollbackTransaction();
      return { 
        message: "El usuario recluta no tiene un tablero bloqueado.", 
        status: 400 
      };
    }
    
    console.log(`[resolveBoardBlockadeBySecondaryAction] Tablero bloqueado encontrado:`, {
      id: primaryBlockedBoard.id,
      blockadeStage: primaryBlockedBoard.currentBlockadeStage,
      boardState: primaryBlockedBoard.idBoardState
    });

    // 4. Intenta desbloquear el tablero según la etapa de bloqueo
    let unlockResult = { unlocked: false, message: "No se pudo desbloquear el tablero." };

    switch (primaryBlockedBoard.currentBlockadeStage) {
      case 1:
        unlockResult = { 
          unlocked: true, 
          message: "Primera etapa de bloqueo desbloqueada exitosamente por general secundario." 
        };
        break;
      case 2:
        unlockResult = { 
          unlocked: true, 
          message: "Segunda etapa de bloqueo desbloqueada exitosamente por general secundario." 
        };
        break;
      default:
        unlockResult = { 
          unlocked: false, 
          message: `Etapa de bloqueo ${primaryBlockedBoard.currentBlockadeStage} no puede ser desbloqueada por un general secundario.` 
        };
    }

    if (unlockResult.unlocked) {
      primaryBlockedBoard.currentBlockadeStage = null; // Limpiar el bloqueo
      primaryBlockedBoard.idBoardState = BoardStateNumericId.WAITING; // Set board state to active (1)
      await queryRunner.manager.save(primaryBlockedBoard);
      console.log(`[resolveBoardBlockadeBySecondaryAction] ÉXITO: ${unlockResult.message}`);
      await queryRunner.commitTransaction();
      return { message: unlockResult.message, status: 200 };
    } else {
      console.log(`[resolveBoardBlockadeBySecondaryAction] FALLIDO: ${unlockResult.message}`);
      await queryRunner.rollbackTransaction();
      return { message: unlockResult.message, status: 400 };
    }
  } catch (error: any) {
    console.error("[resolveBoardBlockadeBySecondaryAction] Error:", error);
    await queryRunner.rollbackTransaction();
    return { 
      message: `Error interno: ${error.message || error}`, 
      status: 500 
    };
  } finally {
    if (queryRunner && !queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

// TODO: Implementar lógica para desbloqueo de Génesis Etapa 4 (verificación del 3er usuario)
export const resolveGenesisFourthBlockade = async (
  fatherGeneralId: number, // ID del General cuyo tablero (Génesis) está en etapa 4
  queryRunner: QueryRunner
): Promise<ServiceResponse> => {
  console.log(
    '[resolveGenesisFourthBlockade] Called',
    { fatherGeneralId }
  );

  try {
    // 1. Encontrar el tablero Génesis del fatherGeneralId que está esperando este desbloqueo (etapa 4)
    const fatherBoard = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: fatherGeneralId,
        idLevelId: BoardLevelNumericId.GENESIS,
        currentBlockadeStage: 4
      }
    });

    if (!fatherBoard) {
      return {
        message: `No se encontró un tablero Génesis para el general ${fatherGeneralId} en etapa 4 de bloqueo.`,
        status: 404 // O 200 si no es error sino condición no cumplida
      };
    }

    // 2. Contar cuántos usuarios "hijos" (con triplicationOfId = fatherGeneralId) han sido verificados
    // "Verificado" significa idUserProcessState = 4 (VALIDATED) solamente
    const verifiedChildrenCount = await queryRunner.manager.count(EntityUser, {
      where: {
        triplicationOfId: fatherGeneralId,
        idUserProcessState: UserProcessStateId.VALIDATED // Solo contar usuarios completamente verificados
      }
    });

    console.log(`[resolveGenesisFourthBlockade] General ${fatherGeneralId} tiene ${verifiedChildrenCount} hijos verificados en total.`);

    // 3. Si el conteo es >= 3 (el tercer hijo ha sido verificado), desbloquear el tablero
    if (verifiedChildrenCount >= 3) {
      fatherBoard.currentBlockadeStage = null;
      fatherBoard.idBoardState = BoardStateNumericId.WAITING; // Set board state to active (1)
      await queryRunner.manager.save(fatherBoard);
      
      // También marcar que el usuario ha completado su triplicación
      await queryRunner.manager.update(EntityUser, fatherGeneralId, { triplicationDone: true });
      
      return {
        message: `Desbloqueo de Génesis Etapa 4 completado para el tablero ${fatherBoard.id} del general ${fatherGeneralId}. El tercer hijo ha sido verificado.`,
        status: 200
      };
    } else {
      return {
        message: `Desbloqueo de Génesis Etapa 4 aún no procede para el tablero ${fatherBoard.id}. Se requieren 3 hijos verificados en total, actualmente hay ${verifiedChildrenCount}.`,
        status: 200 // No es un error, solo no se cumple la condición aún
      };
    }
  } catch (error: any) {
    console.error("[Service - resolveGenesisFourthBlockade] Error:", error);
    return { message: `Error interno del servidor: ${error.message}`, status: 500 };
  }
};

export const resolveGenesisThirdBlockade = async (
  fatherGeneralId: number,
  queryRunner: QueryRunner
): Promise<ServiceResponse> => {
  console.log('[resolveGenesisThirdBlockade] Verificando condiciones de desbloqueo para el general:', fatherGeneralId);

  try {
    // 1. Encontrar el tablero Genesis del general que está en etapa 3
    const fatherBoard = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: fatherGeneralId,
        idLevelId: BoardLevelNumericId.GENESIS,
        currentBlockadeStage: 3
      }
    });

    if (!fatherBoard) {
      return {
        message: "No se encontró un tablero Genesis en etapa 3 para este general.",
        status: 404
      };
    }

    // 2. Obtener todos los usuarios hijos creados por este general
    const childUsers = await queryRunner.manager.find(EntityUser, {
      where: {
        triplicationOfId: fatherGeneralId
      }
    });

    console.log(`[resolveGenesisThirdBlockade] Total de usuarios hijos encontrados: ${childUsers.length}`);

    if (childUsers.length < 3) {
      return {
        message: "El general debe crear los 3 usuarios hijos requeridos antes de poder desbloquear.",
        status: 400
      };
    }

    // 3. Contar cuántos están verificados (estado VALIDATING o VALIDATED)
    const verifiedUsers = childUsers.filter(user => 
      user.idUserProcessState === UserProcessStateId.VALIDATING ||
      user.idUserProcessState === UserProcessStateId.VALIDATED
    );

    console.log(`[resolveGenesisThirdBlockade] Usuarios verificados (VALIDATING o VALIDATED): ${verifiedUsers.length} de ${childUsers.length}`);

    // 4. Si hay al menos 2 verificados, desbloquear
    if (verifiedUsers.length >= 2) {
      // Desbloquear el tablero
      await queryRunner.manager.update(Board, fatherBoard.id, {
        currentBlockadeStage: null,
        idBoardState: BoardStateNumericId.WAITING,
        isAwaitingUserCreation: false
      });

      // Actualizar el estado de todos los usuarios verificados a VALIDATED
      for (const verifiedUser of verifiedUsers) {
        if (verifiedUser.idUserProcessState === UserProcessStateId.VALIDATING) {
          await queryRunner.manager.update(
            EntityUser,
            { id: verifiedUser.id },
            { idUserProcessState: UserProcessStateId.VALIDATED }
          );
          console.log(`[resolveGenesisThirdBlockade] Usuario ${verifiedUser.id} actualizado a estado VALIDATED`);
        }
      }

      console.log(`[resolveGenesisThirdBlockade] Tablero ${fatherBoard.id} desbloqueado exitosamente y usuarios actualizados`);
      
      return {
        message: "Desbloqueo de etapa 3 completado. El tablero ha sido desbloqueado y los usuarios verificados.",
        status: 200
      };
    }

      return {
      message: `Se requieren al menos 2 usuarios verificados. Actualmente hay ${verifiedUsers.length} verificados.`,
      status: 400
    };

  } catch (error) {
    console.error('[resolveGenesisThirdBlockade] Error:', error);
    return {
      message: "Error al procesar el desbloqueo de la etapa 3.",
      status: 500
    };
  }
};

export const validatePlayer = async (
  playerId: number,
  queryRunner: QueryRunner
) => {
  const user = await queryRunner.manager.findOne(EntityUser, {
    where: { id: playerId }
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  return user;
};

export const updatePlayerById = async (
  playerId: number,
  playerUpdate: QueryDeepPartialEntity<EntityUser>,
  queryRunner: QueryRunner
) => {
  const result = await queryRunner.manager.update(
    EntityUser,
    { id: playerId },
    playerUpdate
  );

  if (!result.affected) {
    throw new Error("No se pudo actualizar el usuario");
  }

  return result;
};

export const verifyPlayerService = async (
  goalScorer: GetVerifyGoalScorerMock,
  defender: LoginUserData,
  board: GetVerifyBoardMock
): Promise<{ message: string }> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Verificar que el ID del jugador existe
    if (!goalScorer.id) {
      throw new Error("ID del jugador no proporcionado");
    }

    const user = await validatePlayer(goalScorer.id, queryRunner);

    // Actualizar el estado del jugador a VALIDATING
    await updatePlayerById(
      goalScorer.id,
      { idUserProcessState: UserProcessStateId.VALIDATING },
      queryRunner
    );

    console.log(`[verifyPlayerService] Usuario ${goalScorer.username} actualizado a estado VALIDATING`);

    // Si este usuario es hijo de un general (triplicationOfId), verificar desbloqueos
    if (user.triplicationOfId) {
      console.log(`[verifyPlayerService] Usuario es hijo del general ${user.triplicationOfId}, verificando desbloqueos...`);
      
      // Intentar desbloquear la etapa 3 usando la función específica
      const unlockResult3 = await resolveGenesisThirdBlockade(
        user.triplicationOfId,
        queryRunner
      );

      console.log(`[verifyPlayerService] Resultado del intento de desbloqueo etapa 3: ${unlockResult3.message} (status: ${unlockResult3.status})`);

      // Intentar desbloquear la etapa 4 también
      const unlockResult4 = await resolveGenesisFourthBlockade(
        user.triplicationOfId,
        queryRunner
      );

      console.log(`[verifyPlayerService] Resultado del intento de desbloqueo etapa 4: ${unlockResult4.message} (status: ${unlockResult4.status})`);
    }

    await queryRunner.commitTransaction();
    return { message: "Usuario verificado exitosamente" };
  } catch (error) {
    console.error("[verifyPlayerService] Error:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    throw error;
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const createChildUsersService = async (
  parentUserId: number,
  childUsers: User[]
): Promise<{ message: string; status: number }> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log(`[createChildUsersService] Starting creation of ${childUsers.length} child users for parent ${parentUserId}`);

    // Verify parent user has a Genesis board in stage 3
    const parentBoard = await queryRunner.manager.findOne(Board, {
      where: {
        idGoalScorer: parentUserId,
        idLevelId: BoardLevelNumericId.GENESIS,
        currentBlockadeStage: 3,
        isAwaitingUserCreation: true
      }
    });

    if (!parentBoard) {
      throw new Error("El tablero del general no está en la etapa correcta para crear usuarios hijos.");
    }

    // Create each child user
    const createdUsers = [];
    for (const userData of childUsers) {
      // Set the creator ID for the child user
      userData.creatorUserId = parentUserId;
      
      // Create the user
      const newUser = await insertUser(userData);
      if (!newUser) {
        throw new Error(`Error al crear usuario hijo: ${userData.username}`);
      }
      createdUsers.push(newUser);
    }

    // If all users were created successfully, commit the transaction
    await queryRunner.commitTransaction();
    
    return {
      message: `Se crearon ${createdUsers.length} usuarios hijos exitosamente.`,
      status: 200
    };

  } catch (error: any) {
    console.error("[createChildUsersService] Error:", error);
    await queryRunner.rollbackTransaction();
    
    return {
      message: error.message || "Error al crear usuarios hijos",
      status: 500
    };
  } finally {
    await queryRunner.release();
  }
};

// Función auxiliar para obtener el nombre del nivel
const getBoardLevelName = (levelId: BoardLevelNumericId): string => {
  switch (levelId) {
    case BoardLevelNumericId.GENESIS:
      return "Génesis";
    case BoardLevelNumericId.ARMAGEDON:
      return "Armagedón";
    case BoardLevelNumericId.APOLO:
      return "Apolo";
    case BoardLevelNumericId.NEPTUNO:
      return "Neptuno";
    default:
      return "Desconocido";
  }
};

export const unlockLowerLevelBoardService = async (
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
  error?: { code: string; details: string };
}> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Verificar que el tablero del general existe y obtener su nivel
    const generalBoard = await queryRunner.manager.findOne(Board, {
      where: { 
        id: boardId,
        idGoalScorer: generalUserId
      }
    });

    if (!generalBoard) {
      throw {
        code: "BOARD_NOT_FOUND",
        details: "El tablero especificado no existe o no eres el general"
      };
    }

    // 2. Determinar qué nivel debe ser desbloqueado basado en el nivel del general
    let targetLevelId: BoardLevelNumericId;
    let maxBlockadeStage: number;
    let onlyEarlyStages = false; // Flag para indicar si solo se permiten etapas 1 y 2

    switch (generalBoard.idLevelId) {
      case BoardLevelNumericId.NEPTUNO:
        targetLevelId = BoardLevelNumericId.APOLO;
        maxBlockadeStage = 3;
        break;
      case BoardLevelNumericId.APOLO:
        targetLevelId = BoardLevelNumericId.ARMAGEDON;
        maxBlockadeStage = 3;
        break;
      case BoardLevelNumericId.ARMAGEDON:
        targetLevelId = BoardLevelNumericId.GENESIS;
        maxBlockadeStage = 4;
        onlyEarlyStages = true; // Solo Armagedón tiene esta restricción
        break;
      default:
        throw {
          code: "INVALID_BOARD_LEVEL",
          details: "Este tablero no tiene capacidad de desbloquear otros tableros"
        };
    }

    // 3. Encontrar al usuario defensor
    const defenderUser = await queryRunner.manager.findOne(EntityUser, {
      where: { username: defenderUsername }
    });

    if (!defenderUser) {
      throw {
        code: "DEFENDER_NOT_FOUND",
        details: "No se encontró el usuario defensor especificado"
      };
    }

    // 4. Encontrar el tablero bloqueado del defensor en el nivel objetivo
    const whereCondition: any = {
      idGoalScorer: defenderUser.id,
      idLevelId: targetLevelId,
      idBoardState: BoardStateNumericId.BLOCKED
    };

    // Solo aplicar restricción de etapas 1 y 2 para Armagedón desbloqueando Génesis
    if (onlyEarlyStages) {
      whereCondition.currentBlockadeStage = In([1, 2]);
    }

    const targetBoard = await queryRunner.manager.findOne(Board, {
      where: whereCondition
    });

    if (!targetBoard) {
      const stageText = onlyEarlyStages ? " en etapa 1 o 2" : "";
      throw {
        code: "BOARD_NOT_FOUND",
        details: `No se encontró un tablero bloqueado de ${getBoardLevelName(targetLevelId)}${stageText} del recluta`
      };
    }

    // 5. Actualizar el estado del tablero y el contador de desbloqueos
    // Primero actualizamos el contador de desbloqueos del usuario
    const currentUnlockCount = defenderUser.unlockCount || 0;
    await queryRunner.manager.update(
      EntityUser,
      { id: defenderUser.id },
      { 
        unlockCount: currentUnlockCount + 1
      }
    );

    // Luego actualizamos el estado del tablero
    await queryRunner.manager.update(
      Board,
      { id: targetBoard.id },
      { 
        idBoardState: BoardStateNumericId.WAITING, // Siempre WAITING (1) para que pueda seguir jugando
        currentBlockadeStage: null
      }
    );

    // Verificar ambas actualizaciones
    const [updatedBoard, updatedUser] = await Promise.all([
      queryRunner.manager.findOne(Board, {
        where: { id: targetBoard.id }
      }),
      queryRunner.manager.findOne(EntityUser, {
        where: { id: defenderUser.id }
      })
    ]);

    if (!updatedBoard || updatedBoard.idBoardState !== BoardStateNumericId.WAITING) {
      throw {
        code: "UPDATE_FAILED",
        details: "No se pudo actualizar el estado del tablero"
      };
    }

    if (!updatedUser || updatedUser.unlockCount !== currentUnlockCount + 1) {
      throw {
        code: "UPDATE_FAILED",
        details: "No se pudo actualizar el contador de desbloqueos"
      };
    }

    await queryRunner.commitTransaction();

    return {
      success: true,
      message: `Se desbloqueó el tablero de ${getBoardLevelName(targetLevelId)} (etapa ${targetBoard.currentBlockadeStage})`,
      data: {
        username: defenderUsername,
        unlockCount: updatedUser.unlockCount,
        state: 'WAITING'
      }
    };

  } catch (error) {
    console.error("[unlockLowerLevelBoardService] Error:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }

    if ((error as { code: string }).code) {
      return {
        success: false,
        message: "Error al realizar el desbloqueo",
        error: error as { code: string; details: string }
      };
    }

    return {
      success: false,
      message: "Error interno del servidor",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: error instanceof Error ? error.message : "Error desconocido"
      }
    };
  } finally {
    await queryRunner.release();
  }
};

export const getUserProfileService = async (userId: number): Promise<ServiceResponse & { data?: UserProfile }> => {
  try {
    const user = await searchUserById(userId);
    
    if (!user) {
      return {
        message: "Usuario no encontrado",
        status: 404
      };
    }

    const profileData: UserProfile = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.username, // username serves as email
      phoneNumber: user.phoneNumber,
      securityQuestion: user.securityQuestion,
      paymentMethods: user.paymentMethods
    };

    return {
      message: "Perfil obtenido exitosamente",
      status: 200,
      data: profileData
    };

  } catch (error) {
    console.error("[getUserProfileService] Error:", error);
    return {
      message: "Error interno del servidor",
      status: 500
    };
  }
};

// Función para validar métodos de pago
const validatePaymentMethods = (paymentMethods: any[]): { valid: boolean; error?: string } => {
  for (const method of paymentMethods) {
    if (!method.type || !method.value) {
      return { valid: false, error: "Cada método de pago debe tener 'type' y 'value'" };
    }

    switch (method.type.toLowerCase()) {
      case 'nequi':
        // Validar que sea un número de teléfono colombiano
        const phoneRegex = /^[3][0-9]{9}$/;
        if (!phoneRegex.test(method.value.replace(/\s+/g, ''))) {
          return { valid: false, error: "Nequi debe ser un número de teléfono válido (ej: 3001234567)" };
        }
        break;
      case 'bancolombia':
        // Validar que tenga número de cuenta y tipo de cuenta
        if (!method.accountType) {
          return { valid: false, error: "Bancolombia debe incluir 'accountType' (ahorros, corriente)" };
        }
        if (!['ahorros', 'corriente'].includes(method.accountType.toLowerCase())) {
          return { valid: false, error: "accountType debe ser 'ahorros' o 'corriente'" };
        }
        // Validar que el número de cuenta tenga entre 8-12 dígitos
        if (!/^[0-9]{8,12}$/.test(method.value)) {
          return { valid: false, error: "Número de cuenta Bancolombia debe tener entre 8-12 dígitos" };
        }
        break;
      case 'daviplata':
        // Validar que sea un número de teléfono
        const daviPhoneRegex = /^[3][0-9]{9}$/;
        if (!daviPhoneRegex.test(method.value.replace(/\s+/g, ''))) {
          return { valid: false, error: "Daviplata debe ser un número de teléfono válido (ej: 3001234567)" };
        }
        break;
      case 'binance':
        // Validar que sea un string de al menos 5 caracteres (puede ser correo o ID de usuario)
        if (typeof method.value !== 'string' || method.value.trim().length < 5) {
          return { valid: false, error: "Binance debe ser un correo o ID de usuario válido (mínimo 5 caracteres)" };
        }
        break;
      default:
        // Para otros tipos, solo validar que tengan valor
        if (method.value.length < 3) {
          return { valid: false, error: `Valor para ${method.type} debe tener al menos 3 caracteres` };
        }
    }
  }
  
  return { valid: true };
};

export const updateUserProfileService = async (
  userId: number, 
  updateData: UpdateUserProfileRequest
): Promise<ServiceResponse> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Check if user exists
    const existingUser = await queryRunner.manager.findOne(EntityUser, {
      where: { id: userId }
    });

    if (!existingUser) {
      await queryRunner.rollbackTransaction();
      return {
        message: "Usuario no encontrado",
        status: 404
      };
    }

    // Check if username is being changed and if new username already exists
    if (updateData.username && updateData.username !== existingUser.username) {
      const usernameExists = await queryRunner.manager.findOne(EntityUser, {
        where: { username: updateData.username }
      });

      if (usernameExists) {
        await queryRunner.rollbackTransaction();
        return {
          message: "El nombre de usuario ya está en uso",
          status: 400
        };
      }
    }

    // Validate payment methods if provided
    if (updateData.paymentMethods && Array.isArray(updateData.paymentMethods)) {
      const validation = validatePaymentMethods(updateData.paymentMethods);
      if (!validation.valid) {
        await queryRunner.rollbackTransaction();
        return {
          message: `Error en métodos de pago: ${validation.error}`,
          status: 400
        };
      }
    }

    // Prepare update data
    const updatePayload: any = {};

    if (updateData.firstName) updatePayload.firstName = updateData.firstName;
    if (updateData.lastName) updatePayload.lastName = updateData.lastName;
    if (updateData.username) updatePayload.username = updateData.username;
    if (updateData.phoneNumber) updatePayload.phoneNumber = updateData.phoneNumber;
    if (updateData.securityQuestion) updatePayload.securityQuestion = updateData.securityQuestion;
    
    // Handle payment methods - IMPORTANTE: Esto reemplaza TODOS los métodos existentes
    if (updateData.paymentMethods !== undefined) {
      updatePayload.paymentMethods = updateData.paymentMethods;
    }

    // Handle security answer separately if provided (needs hashing)
    if (updateData.securityAnswer) {
      const hashedAnswer = await encrypt(updateData.securityAnswer);
      updatePayload.securityAnswerHash = hashedAnswer;
    }

    // Update user
    await queryRunner.manager.update(EntityUser, { id: userId }, updatePayload);

    await queryRunner.commitTransaction();

    return {
      message: "Perfil actualizado exitosamente",
      status: 200
    };

  } catch (error) {
    console.error("[updateUserProfileService] Error:", error);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    
    return {
      message: "Error interno del servidor",
      status: 500
    };
  } finally {
    await queryRunner.release();
  }
};
//DataSource
import { AppDataSource } from "../config/db";

//Entities
import { Board } from "../entities/board.entity";
import { Tail } from "../entities/tail.entity";
import { EntityUser } from "../entities/user.entity";

//Interfaces
import { In, QueryRunner } from "typeorm";
import { User } from "../interfaces/user.interface";

//Utils
import { encrypt } from "../utils/bcrypt.handle";
import { getPositionAvailable } from "../utils/getPositionAvailable";

// Services
import { createSubscription } from "./subscription.service";
import { searchUserByUsername } from "./user.service";

//Services
////////////////////////////////////////////////////////////////////////////////////////
export const assignToParents = async (
  queryRunner: QueryRunner,
  userId: number,
  positionAvailable:
    | "idGoalScorer"
    | "idCreator1"
    | "idCreator2"
    | "idGenerator1"
    | "idGenerator2"
    | "idGenerator3"
    | "idGenerator4"
    | "idDefender1"
    | "idDefender2"
    | "idDefender3"
    | "idDefender4"
    | "idDefender5"
    | "idDefender6"
    | "idDefender7"
    | "idDefender8",
  stadium: Board
) => {
  try {
    let idUserToModify;

    switch (positionAvailable) {
      case "idCreator1":
        idUserToModify = stadium.idGoalScorer;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idCreator2":
        idUserToModify = stadium.idGoalScorer;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      case "idGenerator1":
        idUserToModify = stadium.idCreator1;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idGenerator2":
        idUserToModify = stadium.idCreator1;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      case "idGenerator3":
        idUserToModify = stadium.idCreator2;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idGenerator4":
        idUserToModify = stadium.idCreator2;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      case "idDefender1":
        idUserToModify = stadium.idGenerator1;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idDefender2":
        idUserToModify = stadium.idGenerator1;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      case "idDefender3":
        idUserToModify = stadium.idGenerator2;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idDefender4":
        idUserToModify = stadium.idGenerator2;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      case "idDefender5":
        idUserToModify = stadium.idGenerator3;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idDefender6":
        idUserToModify = stadium.idGenerator3;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      case "idDefender7":
        idUserToModify = stadium.idGenerator4;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idLeftAssociation: userId,
        });

        break;

      case "idDefender8":
        idUserToModify = stadium.idGenerator4;

        await queryRunner.manager.update(EntityUser, idUserToModify, {
          idRightAssociation: userId,
        });

        break;

      default:
        throw new Error("No se encontró que usuario padre actualizar.");
    }
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const insertPlayer = async (
  queryRunner: QueryRunner,
  userData: User
) => {
  try {
    const passwordCrypt = await encrypt(userData.password);

    const newUser: EntityUser = await queryRunner.manager.save(EntityUser, {
      ...userData,
      password: passwordCrypt,
      idRole: 2,
      idUserState: 1,
      idUserProcessState: 1,
    });

    return newUser;
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const registerPlayerInTail = async (
  queryRunner: QueryRunner,
  playerId: number
) => {
  // await queryRunner.startTransaction();
  try {
    await queryRunner.manager.save(Tail, { idUser: playerId });
  } catch (error) {
    throw new Error(`${error}`);
  }
};

export const registerInStadium = async (
  queryRunner: QueryRunner,
  playerId: number,
  stadium: Board
) => {
  try {
    //Get who place assign to user
    const positionAvailable = getPositionAvailable(stadium);

    if (!positionAvailable) {
      // Handle case where no position is available (e.g., board is full)
      throw new Error(`El estadio ${stadium.id} ya está lleno.`);
    }

    //Assign to parents
    await assignToParents(queryRunner, playerId, positionAvailable, stadium);

    // Create a specific update object
    const boardUpdate = {
      [positionAvailable]: playerId,
    };

    // Temporarily assign to check if board is full *after* this assignment
    // const tempStadium = { ...stadium, [positionAvailable]: playerId }; // OLD - Creates plain object
    // const boardFull: boolean = !getPositionAvailable(tempStadium); // OLD - Error: tempStadium is not Board entity

    // NEW: Check if the assigned position is the last one
    const boardFull: boolean = positionAvailable === "idDefender8"; 

    if (boardFull) {
      boardUpdate["idBoardState"] = 2; 
      console.log(`[Service - registerInStadium] Board ${stadium.id} IS NOW FULL. Attempting to set idBoardState to 2 (Active).`);
    } else {
      // If the board is NOT yet full, ensure it remains in WaitingForPlayers (state 1)
      // This handles the case where a board might have been in a different state and a player is added without filling it.
      // However, standard flow implies boards being filled are in state 1.
      // boardUpdate["idBoardState"] = 1; // Explicitly keep/set to WaitingForPlayers
      // console.log(`[Service - registerInStadium] Board ${stadium.id} is NOT YET FULL. Ensuring idBoardState remains/is set to 1 (WaitingForPlayers).`);
      // No change to idBoardState if not full and was already 1. If it was different, this needs review.
    }

    // Apply targeted updates to the board
    console.log(`[registerInStadium] Attempting to update Board ID: ${stadium.id}`); // LOG
    console.log(`[registerInStadium] Assigning Player ID: ${playerId} to Position: ${positionAvailable}`); // LOG
    console.log(`[registerInStadium] Final Board Update Object:`, boardUpdate); // LOG
    const updateResult = await queryRunner.manager.update(Board, { id: stadium.id }, boardUpdate);
    console.log(`[registerInStadium] Board ${stadium.id} update complete. Affected rows: ${updateResult.affected}`); // LOG

    if (!updateResult.affected || updateResult.affected === 0) {
        console.error(`[registerInStadium] Failed to update board ${stadium.id} for player ${playerId}. No rows affected.`);
        throw new Error(`Failed to update board ${stadium.id} when registering player ${playerId}.`);
    }

    // Create Subscription
    // Assuming SubscriptionState ID 1 is "Active"
    await createSubscription(playerId, stadium.id, 1, queryRunner);

    //Change state of player to "2" and assign captain
    console.log(`[registerInStadium] Updating Player ID: ${playerId} state and captain`); // LOG
    const playerUpdateResult = await queryRunner.manager.update(
      EntityUser,
      { id: playerId },
      {
        idUserProcessState: 2,
        idCaptain: stadium.idGoalScorer === null ? undefined : stadium.idGoalScorer
      } 
    );

    if (!playerUpdateResult.affected || playerUpdateResult.affected === 0) {
        console.error(`[registerInStadium] Failed to update user process state for player ${playerId}. No rows affected.`);
        // Decide if this should throw an error and rollback
    }

  } catch (error) {
    console.error(`[Service - registerInStadium] Error during registration for Player ID: ${playerId} in Stadium ID: ${stadium.id}:`, error);
    // Error will be caught by the calling service (assignPlayerService) and rolled back if necessary
    throw error; // Re-throw to ensure transaction rollback in calling service
  }
};
///////////////////////////////////////////////////////////////////////////////////////////

export const insertTriplicationService = async (
  userId: number,
  listUserData: User[]
): Promise<{ message: string; success: boolean }> => {
  if (listUserData.length !== 3)
    return {
      message: "Faltan datos para ejecutar la triplicación.",
      success: false,
    };

  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();

  try {
    // Start transaction
    await queryRunner.startTransaction();

    //Search a Boards whit available places
    const availableBoards = await queryRunner.manager.find(Board, {
      where: {
        idBoardState: In([1]),
        idLevelId: In([1]),
      },
      loadRelationIds: true,
      take: 3,
      order: { createAt: "ASC" },
    });

    //Create users iterating list
    for (let index = 0; index < listUserData.length; index++) {
      const userData = listUserData[index];

      //Insert new user
      const newUser = await insertPlayer(queryRunner, userData);

      //Update to assign triplication of
      await queryRunner.manager.update(
        EntityUser,
        { id: newUser.id },
        { triplicationOfId: userId }
      );

      //Insert player in Stadium
      switch (availableBoards.length) {
        case 0:
          await registerPlayerInTail(queryRunner, newUser.id);
          break;

        case 1:
          await registerInStadium(queryRunner, newUser.id, availableBoards[0]);
          break;

        case 2:
          if (index < 2) {
            await registerInStadium(
              queryRunner,
              newUser.id,
              availableBoards[0]
            );
          } else {
            await registerInStadium(
              queryRunner,
              newUser.id,
              availableBoards[1]
            );
          }
          break;

        case 3:
          await registerInStadium(
            queryRunner,
            newUser.id,
            availableBoards[index]
          );
          break;

        default:
          throw new Error(
            "Ocurrio un error buscando los estadios disponibles."
          );
      }
    }

    //Mark as "done" the triplication
    await queryRunner.manager.update(
      EntityUser,
      { id: userId },
      { triplicationDone: true }
    );

    //Save changes
    await queryRunner.commitTransaction();

    return {
      message: "Registro en club goleador exitoso.",
      success: true,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();

    return { message: `${error}`, success: false };
  } finally {
    await queryRunner.release();
  }
};

export const getPlayerDataForResponse = async (playerUsername: string) => {
  try {
    const response = await searchUserByUsername(playerUsername);

    const clean = { ...response };

    delete clean.password;
    delete clean.idLeftAssociation;
    delete clean.idRightAssociation;
    delete clean.idCaptain;
    delete clean.createAt;
    delete clean.updateAt;
    delete clean.idRole;
    delete clean.triplicationOfId;

    if (!response)
      throw new Error("ERROR FATAL: no se encontro informacion del jugador.");

    return clean;
  } catch (error) {
    throw new Error(`${error}`);
  }
};

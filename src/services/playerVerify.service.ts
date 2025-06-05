// Type
import { QueryRunner } from "typeorm";
import {
    GetVerifyBoardMock,
    GetVerifyGoalScorerMock,
} from "../interfaces/mock.interface";
import { BoardLevel, UserProcessStateId } from "../types/enums.types";

// Config
import { AppDataSource } from "../config/db";

// Entities
import { Board } from "../entities/board.entity";
import { EntityUser } from "../entities/user.entity";
import { LoginUserData } from "../interfaces/user.interface";

// Services
import {
    resolveGenesisFourthBlockade,
    resolveGenesisThirdBlockade
} from "./user.service";

export const playerVerify = async (
  goalScorer: GetVerifyGoalScorerMock,
  defender: LoginUserData,
  board: GetVerifyBoardMock,
  queryRunner?: QueryRunner
): Promise<{
  message: string;
  status: number;
}> => {
  try {
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
      // Update number of balls received of goal scorer
      const newBallsReceived = goalScorer.ballsReceived + 1;
      await queryRunner.manager.update(
        EntityUser,
        { username: goalScorer.username },
        { ballsReceived: newBallsReceived }
      );

      // Fetch the actual board entity
      const boardEntity = await queryRunner.manager.findOne(Board, { where: { id: board.id } });

      if (boardEntity) {
        let newBlockadeStage: number | null = null;
        let newIsAwaitingUserCreation = boardEntity.isAwaitingUserCreation;

        // Determine blockade stage based on board level and balls received
        if (board.level === BoardLevel.OLÍMPICO) {
          if (newBallsReceived === 2) newBlockadeStage = 1;
          else if (newBallsReceived === 4) newBlockadeStage = 2;
          else if (newBallsReceived === 6) {
            newBlockadeStage = 3;
            newIsAwaitingUserCreation = true;
          } else if (newBallsReceived === 7) newBlockadeStage = 4;
        } else if (board.level === BoardLevel.CENTENARIO) {
          if (newBallsReceived === 2) newBlockadeStage = 1;
          else if (newBallsReceived === 4) newBlockadeStage = 2;
          else if (newBallsReceived === 6) newBlockadeStage = 3;
        } else if (board.level === BoardLevel.AZTECA) {
          if (newBallsReceived === 2) newBlockadeStage = 1;
          else if (newBallsReceived === 4) newBlockadeStage = 2;
          else if (newBallsReceived === 6) newBlockadeStage = 3;
        }

        if (newBlockadeStage !== null && newBlockadeStage !== boardEntity.currentBlockadeStage) {
          // Use direct update instead of saving the whole entity
          await queryRunner.manager.update(
            Board,
            { id: board.id },
            { 
              currentBlockadeStage: newBlockadeStage,
              isAwaitingUserCreation: newIsAwaitingUserCreation,
              idBoardState: 3 // BLOCKED
            }
          );
          
          console.log(`[PlayerVerify] Tablero ${board.id} actualizado con idBoardState=3 (BLOCKED), currentBlockadeStage=${newBlockadeStage}, isAwaitingUserCreation=${newIsAwaitingUserCreation}`);
        }
      }

      // Fetch the full goalScorer entity to check triplicationOfId
      const fullGoalScorerEntity = await queryRunner.manager.findOne(EntityUser, { where: { username: goalScorer.username } });

      if (fullGoalScorerEntity && fullGoalScorerEntity.triplicationOfId && boardEntity) {
        const fatherGeneralId = fullGoalScorerEntity.triplicationOfId;
        console.log(`[PlayerVerify] Goalscorer ${fullGoalScorerEntity.username} is a child of ${fatherGeneralId}. Attempting Genesis unlocks.`);

          // Attempt to resolve 3rd blockade
        const thirdBlockadeResult = await resolveGenesisThirdBlockade(
          fatherGeneralId,
            queryRunner
          );
          
        if (thirdBlockadeResult.status === 200) {
            console.log(`[PlayerVerify] Genesis 3rd blockade resolved for father ${fatherGeneralId} by child ${fullGoalScorerEntity.username}: ${thirdBlockadeResult.message}`);
          } else {
            console.warn(`[PlayerVerify] Attempt to resolve Genesis 3rd blockade for father ${fatherGeneralId}: ${thirdBlockadeResult.message}`);
          }

        // Attempt to resolve 4th blockade
          const fourthBlockadeResult = await resolveGenesisFourthBlockade(fatherGeneralId, queryRunner);
          if (fourthBlockadeResult.status === 200) {
            console.log(`[PlayerVerify] Genesis 4th blockade resolved for father ${fatherGeneralId} by child ${fullGoalScorerEntity.username}: ${fourthBlockadeResult.message}`);
        } else if (fourthBlockadeResult.status !== 501) {
              console.warn(`[PlayerVerify] Attempt to resolve Genesis 4th blockade for father ${fatherGeneralId} returned status ${fourthBlockadeResult.status}: ${fourthBlockadeResult.message}`);
        }
      }

      // Update number of balls sended of player and change state to verify
      // Depend of level update balls sended
      if (
        board.level === BoardLevel.OLÍMPICO ||
        board.level === BoardLevel.CENTENARIO
      ) {
        await queryRunner.manager.update(
          EntityUser,
          { username: defender.username },
          { idUserProcessState: UserProcessStateId.VALIDATING }
        );
      } else {
        await queryRunner.manager.update(
          EntityUser,
          { username: defender.username },
          { ballsSended: defender.ballsSended + 1, idUserProcessState: UserProcessStateId.VALIDATING }
        );
      }

      //Save changes if...
      if (shouldReleaseQueryRunner) {
        await queryRunner.commitTransaction();
      }

      return {
        message: `Se ha hecho la solicitud de verificación correctamente.`,
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
  } catch (error) {
    throw new Error(`${error}`);
  }
};

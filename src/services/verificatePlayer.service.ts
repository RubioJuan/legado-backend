// Types
import { QueryRunner } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { GetVerifyBoardMock } from "../interfaces/mock.interface";
import { LoginUserData } from "../interfaces/user.interface";
import { BoardLevel, BoardStateNumericId, Role } from "../types/enums.types";

// Config
import { AppDataSource } from "../config/db";

// Entities
import { Board } from "../entities/board.entity";
import { EntityUser } from "../entities/user.entity";

// Services
import {
    promoteGoalScorerToNextLevelService,
    PromotionServiceResponse
} from "./board.service";

import {
    DualRolePromotionResponse,
    promoteDualRoleGoalScorerService
} from "./promoteGoalScorerToNextLevelService";

import {
    resolveGenesisFourthBlockade,
    resolveGenesisThirdBlockade
} from "./user.service";

// Mock Data (Consider removing if not testing with mocks anymore)
// import boardData from "../mocks/board.json";
// import userData from "../mocks/users.json";

// Define return type for service
export type VerificateServiceResponse = {
  message: string;
  status: number;
  promotedToBoardId?: number;
  splitBoardA_Id?: number;
  splitBoardB_Id?: number;
};

export const verificatePlayerService = async (
  goalScorerData: LoginUserData, // Use full user data
  defenderData: LoginUserData, // Use full user data
  boardData: GetVerifyBoardMock, // Keep mock type for structure
  queryRunner?: QueryRunner
): Promise<VerificateServiceResponse> => {
  // **** LOG INICIO verificatePlayerService ****
  console.log(`[DEBUG verificatePlayerService] === ENTERING verificatePlayerService ===`);
  console.log(`[DEBUG verificatePlayerService] GoalScorer: ${goalScorerData.username} (ID: ${goalScorerData.id}), Current BallsConfirmed: ${goalScorerData.ballsReceivedConfirmed}`);
  console.log(`[DEBUG verificatePlayerService] Defender: ${defenderData.username} (ID: ${defenderData.id})`);
  console.log(`[DEBUG verificatePlayerService] Board: ID ${boardData.id}, Level: ${boardData.level} (Numeric ID: ${boardData.idLevelId})`);
  // **** FIN LOG INICIO ****

  let shouldReleaseQueryRunner = false;
  let localQueryRunner: QueryRunner;

  if (!queryRunner) {
    localQueryRunner = AppDataSource.createQueryRunner();
    await localQueryRunner.connect();
    await localQueryRunner.startTransaction();
    shouldReleaseQueryRunner = true;
    console.log(`[Service - Verificate] No QueryRunner passed, created a new one.`);
  } else {
    localQueryRunner = queryRunner;
    console.log(`[Service - Verificate] Using passed QueryRunner.`);
  }

  console.log(`[Service - Verificate] Starting verification transaction for Defender: ${defenderData.username} by GoalScorer: ${goalScorerData.username}`);

  try {
    const defenderId = defenderData.id;
    const goalScorerId = goalScorerData.id;
    const currentLevelId = boardData.idLevelId; // Use ID from board data
    const originalBoardId = boardData.id;

    // Obtener el tablero completo para verificar su estado actual
    const completeBoard = await localQueryRunner.manager.findOne(Board, {
      where: { id: originalBoardId }
    });
    
    if (!completeBoard) {
      throw new Error(`No se pudo encontrar el tablero ${originalBoardId}`);
    }
    
    // Verificar si el tablero ya está en estado bloqueado
    if (completeBoard.idBoardState === BoardStateNumericId.BLOCKED) {
      return {
        message: `El tablero ${originalBoardId} está bloqueado. No se pueden hacer verificaciones hasta que se desbloquee.`,
        status: 403
      };
    }

    // Obtener información completa del usuario incluyendo el rol exacto y el estado secundario
    const fullGoalScorerData = await localQueryRunner.manager.findOne(EntityUser, { 
      where: { id: goalScorerId },
      relations: ['role'] 
    });

    // Verificar si el usuario es un admin o tiene rol dual
    const isAdmin = fullGoalScorerData?.idRole === 1;
    const hasDualRole = fullGoalScorerData?.secondaryBoardIdAsRecruit !== null;
    
    console.log(`[Service - Verificate] GoalScorer role data: ID=${goalScorerId}, role=${fullGoalScorerData?.role?.name || 'unknown'}, roleId=${fullGoalScorerData?.idRole || 'unknown'}, isAdmin=${isAdmin ? 'YES' : 'NO'}, hasDualRole=${hasDualRole ? 'YES' : 'NO'}`);
    
    // Info detallada sobre el rol dual
    if (hasDualRole) {
      console.log(`[Service - Verificate] INFO ROL DUAL: El usuario ${goalScorerId} (${goalScorerData.username}) tiene rol secundario en tablero ${fullGoalScorerData?.secondaryBoardIdAsRecruit} como ${fullGoalScorerData?.secondaryPositionAsRecruit}`);
    } else {
      console.log(`[Service - Verificate] El usuario ${goalScorerId} (${goalScorerData.username}) NO tiene rol dual`);
    }

    // Update Defender state to VALIDATED
    console.log(`[Service - Verificate] Attempting to update Defender ${defenderData.username} (ID: ${defenderId}) state to VALIDATED (4).`);
    const updateDefenderResult = await localQueryRunner.manager.update(
      EntityUser,
      defenderId,
      { idUserProcessState: 4 } // Directly use state ID 4 for VALIDATED
    );
    if (!updateDefenderResult.affected || updateDefenderResult.affected === 0) {
        throw new Error(`Failed to update defender ${defenderData.username} state.`);
    }
    console.log(`[Service - Verificate] Defender ${defenderData.username} state update successful.`);

    // Verificar si el defensor es un usuario hijo y necesita desbloquear a su padre
    const defenderUser = await localQueryRunner.manager.findOne(EntityUser, {
      where: { id: defenderId }
    });

    if (defenderUser && defenderUser.triplicationOfId) {
      console.log(`[Service - Verificate] Defender ${defenderData.username} is a child of general ${defenderUser.triplicationOfId}, attempting to unlock...`);
      
      // Intentar desbloquear etapa 3
      const unlockResult3 = await resolveGenesisThirdBlockade(
        defenderUser.triplicationOfId,
        localQueryRunner
      );

      console.log(`[Service - Verificate] Genesis third blockade unlock attempt result: ${unlockResult3.message} (status: ${unlockResult3.status})`);

      // Intentar desbloquear etapa 4 también
      const unlockResult4 = await resolveGenesisFourthBlockade(
        defenderUser.triplicationOfId,
        localQueryRunner
      );

      console.log(`[Service - Verificate] Genesis fourth blockade unlock attempt result: ${unlockResult4.message} (status: ${unlockResult4.status})`);
    }

    // Increment GoalScorer's confirmed balls FIRST
    const currentConfirmed = goalScorerData.ballsReceivedConfirmed || 0;
    const newConfirmed = currentConfirmed + 1;
    console.log(`[Service - Verificate] GoalScorer ${goalScorerData.username} NEW potential ballsReceivedConfirmed: ${newConfirmed}`);
    
    // IMPORTANTE: PRIMERO actualizar el contador de donaciones en la base de datos
    // para garantizar que el valor esté actualizado antes de aplicar lógica de bloqueo
    await localQueryRunner.manager.update(
      EntityUser,
      goalScorerId,
      { ballsReceivedConfirmed: newConfirmed }
    );
    console.log(`[Service - Verificate] CONTADOR ACTUALIZADO: GoalScorer ${goalScorerData.username} ahora tiene ${newConfirmed} donaciones confirmadas.`);
    
    // Lógica de bloqueos según nivel y número de donaciones
    let shouldBlockBoard = false;
    let blockadeStage: number | null = null;
    
    // Volvemos a la lógica original: solo los admin están excluidos
    if (!isAdmin) {
      console.log(`[Service - Verificate] Aplicando lógica de bloqueos para usuario NO ADMIN con ${newConfirmed} donaciones confirmadas. User has dual role: ${hasDualRole ? 'YES' : 'NO'}`);
      
      // 1. Genesis tiene 4 bloqueos: 2, 4, 6 y 7 donaciones
      if (boardData.level === BoardLevel.OLÍMPICO) {
        if (newConfirmed === 2) {
          shouldBlockBoard = true;
          blockadeStage = 1;
          console.log(`[Service - Verificate] Tablero Genesis ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (2 donaciones).`);
        } else if (newConfirmed === 4) {
          shouldBlockBoard = true;
          blockadeStage = 2;
          console.log(`[Service - Verificate] Tablero Genesis ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (4 donaciones).`);
        } else if (newConfirmed === 6) {
          shouldBlockBoard = true;
          blockadeStage = 3;
          console.log(`[Service - Verificate] Tablero Genesis ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (6 donaciones, requiere creación de 3 usuarios).`);
        } else if (newConfirmed === 7) {
          shouldBlockBoard = true;
          blockadeStage = 4;
          console.log(`[Service - Verificate] Tablero Genesis ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (7 donaciones).`);
        }
      }
      // 2. Armagedón/Apolo tienen 3 bloqueos: 2, 4 y 6 donaciones
      else if (boardData.level === BoardLevel.CENTENARIO || boardData.level === BoardLevel.AZTECA) {
        if (newConfirmed === 2) {
          shouldBlockBoard = true;
          blockadeStage = 1;
          console.log(`[Service - Verificate] Tablero ${boardData.level} ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (2 donaciones).`);
        } else if (newConfirmed === 4) {
          shouldBlockBoard = true;
          blockadeStage = 2;
          console.log(`[Service - Verificate] Tablero ${boardData.level} ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (4 donaciones).`);
        } else if (newConfirmed === 6) {
          shouldBlockBoard = true;
          blockadeStage = 3;
          console.log(`[Service - Verificate] Tablero ${boardData.level} ${originalBoardId} debe ser bloqueado en etapa ${blockadeStage} (6 donaciones).`);
        }
      }
      // 3. Neptuno no tiene bloqueos
    } else {
      console.log(`[Service - Verificate] Usuario ${goalScorerData.username} es ADMIN. No se aplican bloqueos al tablero.`);
    }
    
    // Aplicar el bloqueo si corresponde
    if (shouldBlockBoard) {
      console.log(`[Service - Verificate] Actualizando estado de bloqueo del tablero ${originalBoardId} a etapa: ${blockadeStage} (Usuario tiene rol dual: ${hasDualRole ? 'SÍ' : 'NO'})`);
      
      try {
        // SIMPLIFICAR la lógica para ser más directos y evitar errores
        // Hardcodear el ID del estado BLOCKED (3) basado en lo que sabemos del sistema
        const blockedStateId = 3; // BLOCKED
        
        // Usar una operación UPDATE directa en lugar de save()
        await localQueryRunner.manager.update(
          Board,
          { id: originalBoardId },
          { 
            idBoardState: blockedStateId,
            currentBlockadeStage: blockadeStage 
          }
        );
        
        console.log(`[Service - Verificate] ÉXITO: Tablero ${originalBoardId} actualizado con UPDATE directo con idBoardState=${blockedStateId} y blockadeStage=${blockadeStage}`);
        
        // Verificar que el bloqueo se aplicó correctamente
        const boardAfterUpdate = await localQueryRunner.manager.findOne(Board, {
          where: { id: originalBoardId }
        });
        
        console.log(`[Service - Verificate] Verificación del bloqueo - Estado actual del tablero ${originalBoardId}: idBoardState=${boardAfterUpdate?.idBoardState}, blockadeStage=${boardAfterUpdate?.currentBlockadeStage}`);
      } catch (error) {
        console.error(`[Service - Verificate] Error al aplicar bloqueo: ${error}`);
        // No lanzamos el error para permitir que el proceso de verificación continúe
      }
    }

    // --- Promotion / State Update Logic ---
    let finalUpdateForGoalScorer: QueryDeepPartialEntity<EntityUser> = {};
    let promotionResult: PromotionServiceResponse | DualRolePromotionResponse | null = null;

    console.log(`[Service - Verificate] Checking board level: ${boardData.level}`);
    console.log(`[Service - Verificate] GoalScorer state: ID=${goalScorerId}, ballsReceivedConfirmed=${newConfirmed}`);

    switch (boardData.level) {
      case BoardLevel.OLÍMPICO:
        console.log(`[Service - Verificate] Entered Génesis level case.`);
        if (newConfirmed === 8) { 
            // **** LOG ANTES DE PROMOCIÓN DESDE GÉNESIS ****
            console.log(`[DEBUG verificatePlayerService] PRE-PROMOTION (Génesis): GoalScorer: ${goalScorerData.username}, currentLevelId (pasado a promo): ${currentLevelId}, originalBoardId: ${originalBoardId}, newConfirmed: ${newConfirmed}`);
            console.log(`[DEBUG verificatePlayerService] CRITICAL CHECK FOR PROMOTION: GoalScorer ID: ${goalScorerData.id}, Admin?: ${goalScorerData.role === Role.ADMINISTRATOR ? 'YES' : 'NO'}, IsSpecialAdmin?: ${(fullGoalScorerData?.idRole === 1 && fullGoalScorerData?.id <= 7) ? 'YES' : 'NO'}, HasDualRole: ${hasDualRole ? 'YES' : 'NO'}`);
            // **** FIN LOG ****
            console.log(`[Service - Verificate] Condition MET for GoalScorer promotion from Génesis. Calling promotion service...`);
            
            // Creamos una copia actualizada de los datos del usuario para pasar a la promoción
            const updatedGoalScorerData = {
                ...goalScorerData,
                // Aseguramos que tenga los datos más actualizados
                ballsReceivedConfirmed: newConfirmed,
            };
            
            // Seleccionar el servicio de promoción adecuado según si el usuario tiene rol dual
            if (hasDualRole) {
              console.log(`[Service - Verificate] Using DUAL ROLE promotion service for user ${goalScorerData.id}`);
              promotionResult = await promoteDualRoleGoalScorerService(
                updatedGoalScorerData,
                currentLevelId,
                originalBoardId,
                localQueryRunner
              );
            } else {
              console.log(`[Service - Verificate] Using standard promotion service for user ${goalScorerData.id}`);
            promotionResult = await promoteGoalScorerToNextLevelService(
                updatedGoalScorerData,
                currentLevelId,
                originalBoardId,
                localQueryRunner
            );
            }
            
            console.log(`[Service - Verificate] Promotion service call completed.`, promotionResult);
            console.log(`[Service - Verificate] Board split information: A=${promotionResult?.splitBoardA_Id}, B=${promotionResult?.splitBoardB_Id}`);
            
            if (!promotionResult) {
                throw new Error("Error inesperado: El servicio de promoción no devolvió un resultado.");
            }

            if (promotionResult.status !== 200) {
                throw new Error(`Promotion failed: ${promotionResult.message}`);
            }
            // Reset balls and set state to VALIDATING (3) for the next level
            console.log(`[Service - Verificate] Promotion successful. Resetting counter and setting state to 3 for GoalScorer ${goalScorerId}.`);
            finalUpdateForGoalScorer.ballsReceivedConfirmed = 0;
            finalUpdateForGoalScorer.idUserProcessState = 3; // 3 = VALIDATING

        } else {
            console.log(`[Service - Verificate] Promotion condition NOT MET for Génesis.`);
        }
        break;

      case BoardLevel.CENTENARIO: // Armagedón
      case BoardLevel.AZTECA:     // Apolo
      case BoardLevel.MONUMENTAL: // Neptuno
        console.log(`[Service - Verificate] Entered ${boardData.level} level case.`);
        if (newConfirmed === 8) { 
            // **** LOG ANTES DE PROMOCIÓN DESDE OTROS NIVELES ****
            console.log(`[DEBUG verificatePlayerService] PRE-PROMOTION (${boardData.level}): GoalScorer: ${goalScorerData.username}, currentLevelId (pasado a promo): ${currentLevelId}, originalBoardId: ${originalBoardId}, newConfirmed: ${newConfirmed}`);
            console.log(`[DEBUG verificatePlayerService] CRITICAL CHECK FOR PROMOTION: GoalScorer ID: ${goalScorerData.id}, Admin?: ${goalScorerData.role === Role.ADMINISTRATOR ? 'YES' : 'NO'}, HasDualRole: ${hasDualRole ? 'YES' : 'NO'}`);
            // **** FIN LOG ****
            console.log(`[Service - Verificate] Condition MET for GoalScorer promotion from ${boardData.level}. Calling promotion service...`);
            
            // Creamos una copia actualizada de los datos del usuario para pasar a la promoción
            const updatedGoalScorerData = {
                ...goalScorerData,
                // Aseguramos que tenga los datos más actualizados  
                ballsReceivedConfirmed: newConfirmed,
            };
            
            // Seleccionar el servicio de promoción adecuado según si el usuario tiene rol dual
            if (hasDualRole) {
              console.log(`[Service - Verificate] Using DUAL ROLE promotion service for user ${goalScorerData.id}`);
              promotionResult = await promoteDualRoleGoalScorerService(
                updatedGoalScorerData,
                currentLevelId,
                originalBoardId,
                localQueryRunner
              );
            } else {
              console.log(`[Service - Verificate] Using standard promotion service for user ${goalScorerData.id}`);
            promotionResult = await promoteGoalScorerToNextLevelService(
                updatedGoalScorerData,
                currentLevelId,
                originalBoardId,
                localQueryRunner
            );
            }
            
            console.log(`[Service - Verificate] Promotion service call completed for ${boardData.level}.`, promotionResult);
            console.log(`[Service - Verificate] Board split information: A=${promotionResult?.splitBoardA_Id}, B=${promotionResult?.splitBoardB_Id}`);

            if (!promotionResult) {
                throw new Error("Error inesperado: El servicio de promoción no devolvió un resultado.");
            }

            if (promotionResult.status !== 200) {
                throw new Error(`Promotion failed for ${boardData.level}: ${promotionResult.message}`);
            }
            
            // If promotion was to a next level (i.e., not final Neptuno completion where promotedToBoardId is null)
            // then reset balls and set state to VALIDATING (3).
            // If it's Neptuno completion, the player's state might be handled differently (e.g., 'COMPLETED_GAME')
            // or they are simply removed from active play, so no state update/ball reset here is needed.
            // promoteGoalScorerToNextLevelService handles the user's final state for Neptuno.
            if (promotionResult.promotedToBoardId !== null) { // Check if actually promoted to a new board
                 console.log(`[Service - Verificate] Promotion from ${boardData.level} successful. Resetting counter and setting state to 1 (ACTIVE) for GoalScorer ${goalScorerId}.`);
                 finalUpdateForGoalScorer.ballsReceivedConfirmed = 0;
                 finalUpdateForGoalScorer.idUserProcessState = 1; // 1 = ACTIVE/GENERAL
            } else if (boardData.level === BoardLevel.MONUMENTAL) {
                console.log(`[Service - Verificate] GoalScorer ${goalScorerId} completed Neptuno. No ball reset or state change here; handled by promotion service.`);
            }
        } else {
            console.log(`[Service - Verificate] Promotion condition NOT MET for ${boardData.level}.`);
        }
        break;

      default:
        console.warn("[Service - Verificate] Board level not handled in switch:", boardData.level);
        break;
    }

    // --- Final GoalScorer Update ---
    // El contador ya fue actualizado al principio, solo actualizar el estado si hubo promoción
    if (Object.keys(finalUpdateForGoalScorer).length > 0) {
      console.log(`[Service - Verificate] Attempting FINAL update for GoalScorer ${goalScorerData.username} (ID: ${goalScorerId}):`, JSON.stringify(finalUpdateForGoalScorer));
      
      // ✅ LÓGICA MEJORADA: Verificar si el usuario tenía verificación previa y rol dual EN CUALQUIER NIVEL
      if (hasDualRole && finalUpdateForGoalScorer.idUserProcessState) {
        // Verificar el estado actual del usuario en la base de datos
        const currentUserState = await localQueryRunner.manager.findOne(EntityUser, {
          where: { id: goalScorerId },
          select: ['idUserProcessState', 'secondaryBoardIdAsRecruit', 'secondaryPositionAsRecruit']
        });
        
        if (currentUserState && currentUserState.idUserProcessState === 4 && 
            currentUserState.secondaryBoardIdAsRecruit && currentUserState.secondaryPositionAsRecruit) {
          console.log(`[Service - Verificate] PRESERVING VERIFICATION FOR ALL LEVELS: User ${goalScorerId} with dual role already has VERIFIED status (4) and active secondary position. Not overriding state.`);
          // Eliminar la actualización del estado, solo actualizar otros campos si los hay
          delete finalUpdateForGoalScorer.idUserProcessState;
          console.log(`[Service - Verificate] Modified final update object for dual role preservation:`, JSON.stringify(finalUpdateForGoalScorer));
        }
      }
      
      // Solo hacer la actualización si aún hay campos para actualizar
      if (Object.keys(finalUpdateForGoalScorer).length > 0) {
    const finalUpdateResult = await localQueryRunner.manager.update(
      EntityUser,
        goalScorerId,
        finalUpdateForGoalScorer
    );
     if (!finalUpdateResult.affected || finalUpdateResult.affected === 0) {
        throw new Error(`Failed to apply final update to goal scorer ${goalScorerData.username}.`);
    }
      console.log(`[Service - Verificate] GoalScorer ${goalScorerData.username} FINAL update successful.`);
      } else {
        console.log(`[Service - Verificate] No final updates needed for GoalScorer ${goalScorerData.username} - dual role verification preserved for ALL LEVELS.`);
      }
    }

    // --- Commit and Respond ---
    console.log(`[Service - Verificate] === BEFORE ATTEMPTING FINAL COMMIT ===`);
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      console.log(`[Service - Verificate] === AFTER SUCCESSFUL FINAL COMMIT ===`);
    } else {
       console.log(`[Service - Verificate] Using existing transaction, commit skipped in this scope.`);
    }

    console.log(`[Service - Verificate] Transaction committed successfully for Defender: ${defenderData.username}.`);

    // Determinar el número de bolas requeridas para el nivel actual.
    let ballsRequiredForLevel = 0;
    if (boardData.level === BoardLevel.OLÍMPICO) { // Asumiendo que OLÍMPICO es el nivel Génesis
      ballsRequiredForLevel = 8;
    }
    // TODO: Añadir más 'else if' para otros niveles si es necesario determinar ballsRequiredForLevel dinámicamente.
    // --- ADDED for other levels ---
    else if (boardData.level === BoardLevel.CENTENARIO || boardData.level === BoardLevel.AZTECA || boardData.level === BoardLevel.MONUMENTAL) {
      ballsRequiredForLevel = 8; // Assuming 8 for these levels too
    }
    // --- END ADDED ---

    let responseMessage: string;
    if (promotionResult && promotionResult.message) {
      responseMessage = promotionResult.message;
    } else {
      responseMessage = `Jugador ${defenderData.username} verificado. Goal Scorer ${goalScorerData.username} tiene ${newConfirmed}/${ballsRequiredForLevel} bolas.`;
      
      if (shouldBlockBoard) {
        responseMessage += ` ¡TABLERO BLOQUEADO en etapa ${blockadeStage}!`;
      }
    }

    const statusCode = promotionResult ? promotionResult.status : 200;

    console.log(`[Service - Verificate] Final response preparation. Message: ${responseMessage}, Status Code: ${statusCode}`);
    return {
      message: responseMessage,
      status: statusCode,
      promotedToBoardId: promotionResult?.promotedToBoardId,
      splitBoardA_Id: promotionResult?.splitBoardA_Id,
      splitBoardB_Id: promotionResult?.splitBoardB_Id,
    };

  } catch (error) {
    console.error(`[Service - Verificate] Verification failed for Defender: ${defenderData.username}. Rolling back...`, error);
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      console.error(`[Service - Verificate] Rollback successful.`);
    }
    throw error; // Re-throw to be handled by controller

  } finally {
    console.log(`[Service - Verificate] Entering FINALLY block.`);
    if (shouldReleaseQueryRunner && !localQueryRunner.isReleased) {
      await localQueryRunner.release();
      console.log(`[Service - Verificate] QueryRunner released.`);
    }
  }
};

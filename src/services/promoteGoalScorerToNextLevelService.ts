// Types
import { QueryRunner } from "typeorm";
import { LoginUserData } from "../interfaces/user.interface";
import { UserProcessStateId } from "../types/enums.types";

// Config
import { AppDataSource } from "../config/db";

// Entities
import { Board } from "../entities/board.entity";
import { Level } from "../entities/level.entity";
import { Subscription } from "../entities/subscription.entity";
import { EntityUser } from "../entities/user.entity";

// Services
import { findNextAvailableBoardSlotService, processGeneralsAwaitingSlots, setupPotentialDualRoleForGeneralService, splitBoardAndPromotePlayers } from "./board.service";

// Define a response interface for this service
export interface DualRolePromotionResponse {
  status: number;
  message: string;
  promotedToBoardId?: number;
  splitBoardA_Id?: number;
  splitBoardB_Id?: number;
}

/**
 * Servicio mejorado para promocionar un General que ha alcanzado 8 donaciones.
 * Si el usuario tiene un rol dual (General + Recluta), mantiene su posición y estado como recluta.
 */
export const promoteDualRoleGoalScorerService = async (
  goalScorerData: LoginUserData,
  currentLevelIdInput: number,
  originalBoardId: number,
  queryRunner?: QueryRunner
): Promise<DualRolePromotionResponse> => {
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
    // Obtener información completa del usuario para verificar sus roles
    const userToPromote = await localQueryRunner.manager.findOne(EntityUser, { 
      where: { id: goalScorerData.id }
    });
    
    if (!userToPromote) {
      throw new Error(`Usuario ${goalScorerData.username} (ID: ${goalScorerData.id}) no encontrado.`);
    }
    
    const hasDualRole = userToPromote.secondaryBoardIdAsRecruit !== null && 
                      userToPromote.secondaryPositionAsRecruit !== null;
    
    console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} dual role status: ${hasDualRole ? 'HAS DUAL ROLE' : 'NO DUAL ROLE'}`);
    
    if (hasDualRole) {
      console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} has secondary role on board ${userToPromote.secondaryBoardIdAsRecruit} as ${userToPromote.secondaryPositionAsRecruit}`);
    }

    // Obtener nivel actual y calcular siguiente nivel
    const currentLevelEntity = await localQueryRunner.manager.findOne(Level, { where: { id: currentLevelIdInput } });
    if (!currentLevelEntity) throw new Error(`Nivel actual ID ${currentLevelIdInput} no encontrado.`);

    const nextLevelIdCalculated = currentLevelEntity.id + 1;
    const nextLevelEntity = await localQueryRunner.manager.findOne(Level, { where: { id: nextLevelIdCalculated } });

    let messageResponse = "";

    // Verificar si el usuario es admin
    const isAdminUser = userToPromote.idRole === 1;
    console.log(`[Service - promoteDualRoleGoalScorer] Admin Check: isAdminUser=${isAdminUser}, userId=${userToPromote.id}, userRole=${userToPromote.idRole}`);

    // Primero, eliminemos al usuario de su posición de general actual
    console.log(`[Service - promoteDualRoleGoalScorer] Eliminating user ${goalScorerData.id} from general position in board ${originalBoardId}`);
    await localQueryRunner.manager.update(Board, originalBoardId, { idGoalScorer: null });

    // Verificar si es el último nivel (Neptuno)
    if (!nextLevelEntity) {
      console.log(`[Service - promoteDualRoleGoalScorer] ${goalScorerData.username} alcanzó el nivel máximo.`);
      
      // Si tiene rol dual, mantenerlo en su posición de recluta
      if (hasDualRole) {
        console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} has completed the game but maintains secondary position as recruit on board ${userToPromote.secondaryBoardIdAsRecruit}.`);
        
        // Solo reiniciamos el contador de donaciones, manteniendo el estado actual del usuario
        // ✅ NUEVA LÓGICA: Verificar si ya está verificado antes de modificar
        const isAlreadyVerified = userToPromote.idUserProcessState === 4; // 4 = VALIDATED
        
        if (isAlreadyVerified) {
          console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} is already VERIFIED. PRESERVING verification state to avoid double verification.`);
          // Solo reiniciamos el contador, manteniendo el estado de verificación
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            ballsReceivedConfirmed: 0
            // NO modificamos idUserProcessState para mantener la verificación
          });
        } else {
          console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} is NOT verified. Resetting to WAITING state.`);
          // Reiniciamos tanto el contador como el estado
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            ballsReceivedConfirmed: 0,
            idUserProcessState: UserProcessStateId.WAITING // Resetear a estado de espera
          });
        }
        
        messageResponse = `¡Felicidades ${goalScorerData.username}! Has completado el juego y mantienes tu posición como recluta en el tablero ${userToPromote.secondaryBoardIdAsRecruit}.`;
      } else {
        messageResponse = `¡Felicidades ${goalScorerData.username}! Has completado el juego.`;
        await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
          idUserProcessState: UserProcessStateId.COMPLETADO,
          secondaryBoardIdAsRecruit: null,
          secondaryBoardLevelIdAsRecruit: null,
          secondaryPositionAsRecruit: null,
          ballsReceivedConfirmed: 0
        });
        
        // ✅ NUEVO: Eliminar subscription ya que el usuario completó el juego
        console.log(`[Service - promoteDualRoleGoalScorer] Removing subscription for completed user ${goalScorerData.id}`);
        await localQueryRunner.manager.delete(Subscription, { 
          idUser: goalScorerData.id,
          idBoard: originalBoardId 
        });
        console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.username} subscription removed. Game completed!`);
      }
    } else {
      // Este es el punto clave: Si el usuario tiene rol dual, debemos promoverlo a su rol secundario actual
      // manteniendo su estado de verificación
      if (hasDualRole && userToPromote.secondaryBoardIdAsRecruit && userToPromote.secondaryBoardLevelIdAsRecruit && userToPromote.secondaryPositionAsRecruit) {
        console.log(`[Service - promoteDualRoleGoalScorer] Promoving user ${goalScorerData.id} to their existing secondary position on board ${userToPromote.secondaryBoardIdAsRecruit}`);
        
        // Limpiar la suscripción del tablero donde era general
        try {
            await localQueryRunner.manager.delete(Subscription, { 
                idUser: goalScorerData.id,
                idBoard: originalBoardId 
            });
            console.log(`[Service - promoteDualRoleGoalScorer] Removed subscription for user ${goalScorerData.id} from original board ${originalBoardId}`);
            
            // Asegurarnos que la suscripción como recluta esté activa
            const recruitSubscription = await localQueryRunner.manager.findOne(Subscription, {
                where: { 
                    idUser: goalScorerData.id,
                    idBoard: userToPromote.secondaryBoardIdAsRecruit
                }
            });
            
            if (recruitSubscription) {
                // Actualizar el estado de la suscripción a activo si no lo está
                if (recruitSubscription.idSubscriptionState !== 1) {
                    await localQueryRunner.manager.update(Subscription, 
                        { id: recruitSubscription.id },
                        { idSubscriptionState: 1 }
                    );
                }
            } else {
                // Si por alguna razón no existe la suscripción como recluta, crearla
                await localQueryRunner.manager.insert(Subscription, {
                    idUser: goalScorerData.id,
                    idBoard: userToPromote.secondaryBoardIdAsRecruit,
                    idSubscriptionState: 1
                });
            }
            console.log(`[Service - promoteDualRoleGoalScorer] Ensured active subscription for user ${goalScorerData.id} on recruit board ${userToPromote.secondaryBoardIdAsRecruit}`);
        } catch (subError: any) {
            console.error(`[Service - promoteDualRoleGoalScorer] Error managing subscriptions for user ${goalScorerData.id}:`, subError);
        }

        // Confirmar que la posición secundaria sigue siendo válida
        const secondaryBoard = await localQueryRunner.manager.findOne(Board, { 
          where: { id: userToPromote.secondaryBoardIdAsRecruit } 
        });
        
        if (!secondaryBoard) {
          throw new Error(`No se encontró el tablero secundario ${userToPromote.secondaryBoardIdAsRecruit} para el usuario ${goalScorerData.id}`);
        }
        
        // Comprobar que la posición secundaria está ocupada por este usuario
        const positionValue = secondaryBoard[userToPromote.secondaryPositionAsRecruit as keyof Board];
        
        if (positionValue !== goalScorerData.id) {
          console.log(`[Service - promoteDualRoleGoalScorer] Warning: User ${goalScorerData.id} was not found in position ${userToPromote.secondaryPositionAsRecruit} on board ${userToPromote.secondaryBoardIdAsRecruit}. Current value: ${positionValue}`);
        }
        
        // Solo reiniciamos el contador de donaciones, manteniendo el estado actual del usuario
        // ✅ NUEVA LÓGICA: Verificar si ya está verificado antes de modificar
        const isAlreadyVerified = userToPromote.idUserProcessState === 4; // 4 = VALIDATED
        
        if (isAlreadyVerified) {
          console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} is already VERIFIED. PRESERVING verification state to avoid double verification.`);
          // Solo reiniciamos el contador, manteniendo el estado de verificación
        await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
          ballsReceivedConfirmed: 0
            // NO modificamos idUserProcessState para mantener la verificación
          });
        } else {
          console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} is NOT verified. Resetting to WAITING state.`);
          // Reiniciamos tanto el contador como el estado
          await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
            ballsReceivedConfirmed: 0,
            idUserProcessState: UserProcessStateId.WAITING // Resetear a estado de espera
        });
        }
        
        boardToPromoteToId = userToPromote.secondaryBoardIdAsRecruit;
        messageResponse = `Jugador ${goalScorerData.username} promovido a su posición de RECLUTA en el tablero ${boardToPromoteToId}. Mantiene su estado de verificación actual.`;
      } else {
        // El usuario no tiene rol dual, seguimos la lógica estándar de búsqueda de posición
        console.log(`[Service - promoteDualRoleGoalScorer] Looking for available position in level ${nextLevelEntity?.id} for user ${goalScorerData.id}`);
        
        if (nextLevelEntity) {
        const availableSlot = await findNextAvailableBoardSlotService(nextLevelEntity.id, localQueryRunner);

        if (availableSlot) {
          // Asignar al usuario a la nueva posición
          await localQueryRunner.manager.update(Board, availableSlot.boardId, { [availableSlot.positionName]: goalScorerData.id });
          boardToPromoteToId = availableSlot.boardId;
          const positionNameStr = availableSlot.positionName as string;

          let newUserProcessState: UserProcessStateId;

          if (positionNameStr.startsWith("idDefender")) {
            // Promovido a Recluta
            newUserProcessState = UserProcessStateId.WAITING;
            messageResponse = `Jugador ${goalScorerData.username} promovido como RECLUTA al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}), posición ${positionNameStr}. Esperando verificación.`;
            
            // Actualizar el usuario
            await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
              idUserProcessState: newUserProcessState,
              secondaryBoardIdAsRecruit: null,
              secondaryBoardLevelIdAsRecruit: null,
              secondaryPositionAsRecruit: null,
              ballsReceivedConfirmed: 0
            });
          } else if (positionNameStr === "idGoalScorer") {
            // Promovido a General
            newUserProcessState = UserProcessStateId.WAITING;
            
            // Actualizar rol principal
            await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
              idUserProcessState: newUserProcessState,
              ballsReceivedConfirmed: 0
            });
            
            console.log(`[Service - promoteDualRoleGoalScorer] User ${goalScorerData.id} promoted to GENERAL on board ${boardToPromoteToId}.`);
            
            // Configurar rol dual si no es admin
            if (!isAdminUser) {
              console.log(`[Service - promoteDualRoleGoalScorer] Setting up dual role for non-admin user ${goalScorerData.id}.`);
              await setupPotentialDualRoleForGeneralService(goalScorerData.id, boardToPromoteToId!, nextLevelEntity.id, localQueryRunner);
            } else {
              console.log(`[Service - promoteDualRoleGoalScorer] Skipping dual role setup for admin user ${goalScorerData.id}.`);
            }
            
            // Procesar generales en espera
            console.log(`[Service - promoteDualRoleGoalScorer] Processing pending generals after promotion.`);
            await processGeneralsAwaitingSlots(localQueryRunner);
            
            messageResponse = `Jugador ${goalScorerData.username} promovido como GENERAL al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}).`;
          } else {
            // Promovido a otra posición (Comandante, Sargento)
            newUserProcessState = UserProcessStateId.VALIDATED;
            messageResponse = `Jugador ${goalScorerData.username} promovido como ${positionNameStr.replace("id", "")} al tablero ${boardToPromoteToId} (Nivel ${nextLevelEntity.name}).`;
            
            await localQueryRunner.manager.update(EntityUser, goalScorerData.id, {
              idUserProcessState: newUserProcessState,
              secondaryBoardIdAsRecruit: null,
              secondaryBoardLevelIdAsRecruit: null,
              secondaryPositionAsRecruit: null,
              ballsReceivedConfirmed: 0
            });
          }
        } else {
          // No hay posiciones disponibles
          console.log(`[Service - promoteDualRoleGoalScorer] No available positions for user ${goalScorerData.id} in level ${nextLevelEntity.id}.`);
          messageResponse = `No hay posiciones disponibles para el jugador ${goalScorerData.username} en el nivel ${nextLevelEntity.name}.`;
          }
        }
        }
      }

      // División del tablero original
      console.log(`[Service - promoteDualRoleGoalScorer] Initiating board split for completed board ${originalBoardId}.`);
      const originalBoardEntityToSplit = await localQueryRunner.manager.findOne(Board, { where: { id: originalBoardId } });
      
      if (originalBoardEntityToSplit) {
        console.log(`[Service - promoteDualRoleGoalScorer] Splitting board ${originalBoardId} with level ${currentLevelEntity.id}`);
        const splitResult = await splitBoardAndPromotePlayers(originalBoardEntityToSplit, currentLevelEntity.id, localQueryRunner);
        splitBoardA_Id = splitResult.splitBoardA_Id;
        splitBoardB_Id = splitResult.splitBoardB_Id;
        
        messageResponse += ` El campo de juego original se ha dividido en dos nuevos campos: ${splitBoardA_Id} y ${splitBoardB_Id}.`;
    }

    // Finalizar transacción si iniciamos una
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
    }

    return {
      status: 200,
      message: messageResponse,
      promotedToBoardId: boardToPromoteToId,
      splitBoardA_Id,
      splitBoardB_Id,
    };

  } catch (error: any) {
    console.error(`[Service - promoteDualRoleGoalScorer] Error: ${error.message}`);
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.rollbackTransaction();
    }
    
    return {
      status: 500,
      message: `Error en la promoción: ${error.message}`,
    };
  } finally {
    if (shouldReleaseQueryRunner && !localQueryRunner.isReleased) {
      await localQueryRunner.release();
    }
  }
}; 
// Type
import { In } from "typeorm"; // Import In operator
import { AppDataSource } from "../config/db";
import { BoardState as BoardStateEntity } from "../entities/board-state.entity"; // Renamed to avoid conflict
import { Board } from "../entities/board.entity"; // Import Board entity if not already
import { Level } from "../entities/level.entity"; // Import Level entity
import { Subscription } from "../entities/subscription.entity";
import { EntityUser } from "../entities/user.entity"; // Import User entity
import { GetBoardMock, PaymentMethod, PlayerInBoardContextual } from "../interfaces/mock.interface.d"; // MODIFICADO para importar PlayerInBoardContextual y usar .d.ts
import { BoardLevel, BoardLevelNumericId, PlayerState, UserProcessStateId } from "../types/enums.types"; // AÑADIDO BoardLevel

// Helper function to safely get properties, returning null if obj is null/undefined
const safeGet = (obj: any, prop: string, defaultValue: any = null) => {
  return obj ? obj[prop] : defaultValue;
};

// Helper function to find the primary board of a user where they are the GoalScorer
async function findUserPrimaryBoard(userId: number, queryRunner?: any): Promise<Board | null> {
    // If queryRunner is available and has a manager (e.g., from within a transaction)
    const manager = queryRunner?.manager || AppDataSource.manager; // Fallback to AppDataSource.manager
    
    // Find subscriptions where the user is the goal scorer of the subscribed board
    const subscriptions = await manager.find(Subscription, {
        where: { idUser: userId },
        relations: ["board", "board.level" /*, "board.boardState" -> No existe boardState como relación directa, es idBoardState */],
    });

    for (const sub of subscriptions) {
        if (sub.board && sub.board.idGoalScorer === userId) {
            // Cargar explícitamente currentBlockadeStage si no viene por defecto
            const boardDetails = await manager.findOne(Board, { where: { id: sub.board.id } });
            return boardDetails; 
        }
    }
    return null; // No primary board found based on this logic
}

export const cleanBoardToGetBoardById = async (board: Board): Promise<GetBoardMock | null> => {
  // **** LOGGING ADDED ****
  console.log('[Util - cleanBoardToGetBoardById] === ENTERING === Input board object:', JSON.stringify(board, null, 2)); 

  if (!board || !board.id) {
      console.error("[Util - cleanBoardToGetBoardById] Input board is null, undefined, or missing an 'id'. Returning null.", board);
      return null;
  }
  // **** END LOGGING ****

  // --- 1. Collect all necessary IDs ---
  const playerIds = [
    board.idGoalScorer, board.idCreator1, board.idCreator2,
    board.idGenerator1, board.idGenerator2, board.idGenerator3, board.idGenerator4,
    board.idDefender1, board.idDefender2, board.idDefender3, board.idDefender4,
    board.idDefender5, board.idDefender6, board.idDefender7, board.idDefender8,
  ].filter(id => id != null) as number[]; // Filter out nulls and assert as number[]

  const levelId = board.idLevelId;
  const boardStateId = board.idBoardState;

  // **** LOGGING ADDED ****
  console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Extracted Player IDs: [${playerIds.join(', ')}]`);
  console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Extracted Level ID: ${levelId}, BoardState ID: ${boardStateId}`);
  
  if (levelId == null || boardStateId == null) {
      console.error(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Missing crucial levelId (${levelId}) or boardStateId (${boardStateId}). Returning null.`);
      return null;
  }
  // **** END LOGGING ****

  // --- 2. Fetch related entities in parallel ---
  try {
    // **** LOGGING ADDED ****
    console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Starting Promise.all to fetch related entities...`);
    // **** END LOGGING ****

    const [
      usersData,          // Array of EntityUser objects
      levelData,          // Level object or null
      boardStateDataObj  // Renamed to avoid conflict with BoardState enum
    ] = await Promise.all([
      playerIds.length > 0 ? EntityUser.find({ 
        where: { id: In(playerIds) },
        relations: [
          "userProcessState", 
          "subscriptions", 
          "subscriptions.board", 
          "subscriptions.board.level",
          "captain",
          "triplicationOf", // Para la relación con el padre (el que lo triplicó)
          "childrenAsTriplicationOf", // Hijos que este usuario triplicó
          "childrenAsTriplicationOf.userProcessState",
          "childrenAsTriplicationOf.captain",
          "childrenAsTriplicationOf.subscriptions", // Para encontrar el tablero del nieto
          "childrenAsTriplicationOf.subscriptions.board" // Para encontrar el tablero del nieto
      ]
      }) : Promise.resolve([]),
      Level.findOne({ where: { id: levelId } }),
      BoardStateEntity.findOne({ where: { id: boardStateId } }) // Use renamed BoardStateEntity
    ]);

    // **** LOGGING ADDED ****
    console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Promise.all completed.`);
    console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Fetched ${usersData.length} users.`);
    console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Fetched Level Data:`, levelData ? `ID ${levelData.id}, Name ${levelData.name}` : 'NULL');
    console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Fetched BoardState Data:`, boardStateDataObj ? `ID ${boardStateDataObj.id}, Name ${boardStateDataObj.name}` : 'NULL');
    
    if (!levelData || !boardStateDataObj) {
        console.error(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Failed to fetch Level (${!!levelData}) or BoardState (${!!boardStateDataObj}). Returning null.`);
        return null;
    }
    // **** END LOGGING ****

    // Log para verificar los datos cargados, incluyendo la relación
    console.log('[Util - cleanBoardToGetBoardById] usersData with relations loaded:', JSON.stringify(usersData.map(u => ({ id: u.id, username: u.username, userProcessStateObj: u.userProcessState }))));

    // --- 4. Create a map for easy user lookup ---
    const usersMap = new Map<number, EntityUser>();
    usersData.forEach(user => usersMap.set(user.id, user));

    // --- 5. Build the final response object ---
    const boardClean: GetBoardMock = {} as GetBoardMock;
    boardClean.id = board.id;
    boardClean.level = safeGet(levelData, 'name', 'Unknown Level') as BoardLevel; // CORREGIDO el casteo
    boardClean.state = safeGet(boardStateDataObj, 'id', 0); 
    boardClean.createAt = board.createAt;
    
    // Añadir explícitamente el estado de bloqueo, asegurando que este valor se pase al frontend
    boardClean.currentBlockadeStage = board.currentBlockadeStage;
    boardClean.idLevelId = levelData.id; // Asegurarnos de incluir el ID numérico del nivel

    // Helper to build player object safely
    const buildPlayer = async (userId: number | null, currentGeneralId: number | null | undefined, currentGeneralBoardLevelId: number | null | undefined): Promise<PlayerInBoardContextual> => {
      // **** LOG DE DEBUG INICIO buildPlayer ****
      console.log(`[Util - buildPlayer DEBUG] === ENTERING buildPlayer === User ID: ${userId}, Current General ID: ${currentGeneralId}, Current General Board Level ID: ${currentGeneralBoardLevelId}`);

      const defaultPlayerResponse: PlayerInBoardContextual = {
        id: userId || undefined,
        username: "N/A (Default)",
        phoneNumber: "N/A",
        state: PlayerState.WAITING,
        unlockCount: 0,
        paymentMethods: null,
        isLockedByThisGeneral: false,
        lockReasonCode: null,
        idBoardRecluta: null,
        additionalIds: null,
      };

      if (userId === null || userId === undefined) {
        console.log("[Util - buildPlayer DEBUG] User ID is null or undefined, returning defaultPlayerResponse.");
        return defaultPlayerResponse;
      }

      const user = usersMap.get(userId);

      if (!user) {
        console.log(`[Util - buildPlayer DEBUG] User ID ${userId} not found in usersMap, returning defaultPlayerResponse.`);
        return { ...defaultPlayerResponse, username: `Not Found (${userId})` };
      }

      // **** LOG DE DEBUG Usuario recuperado ****
      console.log(`[Util - buildPlayer DEBUG] For User ID ${userId} - User object from usersMap:`);
      if (user) {
        console.log(`[Util - buildPlayer DEBUG]   User ID: ${user.id}, Username: ${user.username}, Phone: ${user.phoneNumber}`);
        console.log(`[Util - buildPlayer DEBUG]   User secondaryBoardIdAsRecruit: ${user.secondaryBoardIdAsRecruit}, secondaryBoardLevelIdAsRecruit: ${user.secondaryBoardLevelIdAsRecruit}, UserProcessStateID: ${user.idUserProcessState}`);
        if (user.userProcessState) {
            console.log(`[Util - buildPlayer DEBUG]   UserProcessState Name: ${user.userProcessState.name}`);
        } else {
            console.log("[Util - buildPlayer DEBUG]   UserProcessState (object) is null or undefined.");
        }
      }
      // ---- INICIO DE RESTAURACIÓN DE LÓGICA ORIGINAL ----
      const processStateName = user.userProcessState?.name || 'WAITING';

      let paymentMethodsArray: PaymentMethod[] | null = null;
      if (user.paymentMethods) {
          if (typeof user.paymentMethods === 'string') {
              try {
                  paymentMethodsArray = JSON.parse(user.paymentMethods);
              } catch (e) {
                  console.warn(`[Util - buildPlayer] User ID ${userId} - Failed to parse paymentMethods string:`, user.paymentMethods, e);
              }
          } else if (Array.isArray(user.paymentMethods)) {
        paymentMethodsArray = user.paymentMethods as PaymentMethod[];
          } else {
               console.warn(`[Util - buildPlayer] User ID ${userId} - paymentMethods is neither a string nor an array. Type: ${typeof user.paymentMethods}. Value:`, user.paymentMethods);
          }
      }

      let idBoardRecluta: number | null = null;
      let isLockedByThisGeneral = false;
      let lockReasonCode: string | null = null;
      let additionalIds: any = null; 
      let relevantBoardForLock: Board | null = null;

      if (currentGeneralId && user.id !== currentGeneralId) {
          if (user.secondaryBoardIdAsRecruit && user.idCaptain === currentGeneralId) {
              console.log(`[Util - buildPlayer DEBUG] User ${user.username} (ID ${user.id}) is a recruit in secondary board ${user.secondaryBoardIdAsRecruit}, captained by General ${currentGeneralId}.`);
              relevantBoardForLock = await AppDataSource.manager.findOne(Board, {
                  where: { id: user.secondaryBoardIdAsRecruit }
              });

              if (relevantBoardForLock) {
                  idBoardRecluta = relevantBoardForLock.id;
                  const stage = relevantBoardForLock.currentBlockadeStage;
                  const level = relevantBoardForLock.idLevelId; 
                  console.log(`[Util - buildPlayer DEBUG] Secondary board ${idBoardRecluta} for ${user.username} - Stage: ${stage}, LevelID: ${level}`);

                  if (stage !== null && stage > 0) { 
                      isLockedByThisGeneral = true; 
                      if (level === BoardLevelNumericId.GENESIS) { 
                          if (stage === 1) lockReasonCode = 'GENESIS_NEEDS_DONATION_APPROVAL_1_OF_2';
                          else if (stage === 2) lockReasonCode = 'GENESIS_NEEDS_DONATION_APPROVAL_2_OF_2';
                      } else if (level === BoardLevelNumericId.ARMAGEDON) {
                          if (stage === 1) lockReasonCode = 'ARMAGEDDON_NEEDS_DONATION_APPROVAL_1_OF_2';
                          else if (stage === 2) lockReasonCode = 'ARMAGEDDON_NEEDS_DONATION_APPROVAL_2_OF_2';
                          else if (stage === 3) lockReasonCode = 'ARMAGEDDON_NEEDS_FINAL_APPROVAL';
                      } else if (level === BoardLevelNumericId.APOLO) {
                          if (stage === 1) lockReasonCode = 'APOLO_NEEDS_DONATION_APPROVAL_1_OF_2';
                          else if (stage === 2) lockReasonCode = 'APOLO_NEEDS_DONATION_APPROVAL_2_OF_2';
                          else if (stage === 3) lockReasonCode = 'APOLO_NEEDS_FINAL_APPROVAL';
                      }
                       console.log(`[Util - buildPlayer DEBUG] Lock determined for secondary board: isLocked=${isLockedByThisGeneral}, reason=${lockReasonCode}`);
                  } else {
                      console.log(`[Util - buildPlayer DEBUG] Secondary board ${idBoardRecluta} for ${user.username} has no active blockade (stage is ${stage}).`);
                  }
              } else {
                  console.warn(`[Util - buildPlayer DEBUG] Secondary board ID ${user.secondaryBoardIdAsRecruit} for user ${user.username} not found in DB.`);
              }
          } else {
              console.log(`[Util - buildPlayer DEBUG] User ${user.username} (ID ${user.id}) is not a direct recruit with secondary board under General ${currentGeneralId}. Checking for grandchild confirmation scenario.`);
              const userPrimaryBoardAsGeneral = await findUserPrimaryBoard(user.id); 
              
              if (userPrimaryBoardAsGeneral && 
                  userPrimaryBoardAsGeneral.idLevelId === BoardLevelNumericId.GENESIS && 
                  userPrimaryBoardAsGeneral.currentBlockadeStage !== null && userPrimaryBoardAsGeneral.currentBlockadeStage > 0) {
                  
                  idBoardRecluta = userPrimaryBoardAsGeneral.id; 
                  const stage = userPrimaryBoardAsGeneral.currentBlockadeStage;
                  console.log(`[Util - buildPlayer DEBUG] User ${user.username} is General of primary board ${idBoardRecluta} (Genesis). Stage: ${stage}. Current viewer General ID: ${currentGeneralId}`);

                  if (user.idCaptain === currentGeneralId) {
                    isLockedByThisGeneral = true; 
                    console.log(`[Util - buildPlayer DEBUG] Confirmed: General ${currentGeneralId} is captain of user ${user.username}. This general can unlock.`);

                    if (stage === 3) { 
                        const childrenOfUser = user.childrenAsTriplicationOf || []; 
                        const acceptedByTheirOwnGeneral = childrenOfUser.filter((child: EntityUser) => 
                            child.userProcessState?.id === UserProcessStateId.VALIDATING
                        );
                        console.log(`[Util - buildPlayer DEBUG] User ${user.username} (Genesis Gen.) has ${acceptedByTheirOwnGeneral.length} children 'accepted by their own general'. Stage: ${stage}`);

                        if (acceptedByTheirOwnGeneral.length >= 1 && acceptedByTheirOwnGeneral.length < 2) { 
                             lockReasonCode = 'GENESIS_NEEDS_CHILD_1_PROGRESS_CONFIRMATION';
                             const firstAcceptedChildId = acceptedByTheirOwnGeneral[0]?.id;
                             if (typeof firstAcceptedChildId === 'number') {
                                const childBoard = await findUserPrimaryBoard(firstAcceptedChildId);
                                additionalIds = { childUserIdToVerify: firstAcceptedChildId, childBoardIdToVerify: childBoard?.id };
                             }
                        } else if (acceptedByTheirOwnGeneral.length >= 2) { 
                             lockReasonCode = 'GENESIS_NEEDS_CHILD_2_PROGRESS_CONFIRMATION';
                             const secondAcceptedChildId = acceptedByTheirOwnGeneral[1]?.id;
                             if (typeof secondAcceptedChildId === 'number') {
                                const childBoard = await findUserPrimaryBoard(secondAcceptedChildId);
                                additionalIds = { childUserIdToVerify: secondAcceptedChildId, childBoardIdToVerify: childBoard?.id };
                             }
                        }
                    } else if (stage === 4) { 
                        lockReasonCode = 'GENESIS_NEEDS_7_DONATIONS_AND_CHILD_3_CONFIRMATION';
                        const thirdChild = (user.childrenAsTriplicationOf || []).find((child: EntityUser, index: number) => {
                            const childrenOfUser = user.childrenAsTriplicationOf || [];
                            const acceptedByTheirOwnGeneral = childrenOfUser.filter(c => c.userProcessState?.id === UserProcessStateId.VALIDATING);
                            return acceptedByTheirOwnGeneral.length >=2 && index === 2; 
                        });
                        const thirdChildId = thirdChild?.id;
                        if (typeof thirdChildId === 'number') {
                            const childBoard = await findUserPrimaryBoard(thirdChildId);
                            additionalIds = { childUserIdToVerify: thirdChildId, childBoardIdToVerify: childBoard?.id };
                        } else {
                            additionalIds = { childUserIdToVerify: null, childBoardIdToVerify: null };
                        }
                    }
                     console.log(`[Util - buildPlayer DEBUG] Lock determined for primary board of user ${user.username} (as General): isLocked=${isLockedByThisGeneral}, reason=${lockReasonCode}, additionalIds:`, additionalIds);
                  } else {
                     console.log(`[Util - buildPlayer DEBUG] General ${currentGeneralId} is NOT captain of user ${user.username}. No grandchild confirmation lock by this general.`);
                  }
              } else {
                   console.log(`[Util - buildPlayer DEBUG] User ${user.username} is not General of a relevant primary board or board is not Genesis/not blocked for child confirmation.`);
              }
          }
      } else if (user.id === currentGeneralId) {
          console.log(`[Util - buildPlayer DEBUG] User ${user.username} (ID ${user.id}) IS the General viewing this board. No lock info needed for self.`);
      } else {
          console.log(`[Util - buildPlayer DEBUG] No currentGeneralId provided, or user ${user.username} is the General. Skipping lock calculation for this player.`);
      }

      return {
        id: user.id,
        username: user.username || 'N/A',
        phoneNumber: user.phoneNumber || 'N/A',
        state: processStateName as PlayerState, 
        unlockCount: user.unlockCount || 0,
        paymentMethods: paymentMethodsArray,
        idBoardRecluta,
        isLockedByThisGeneral,
        lockReasonCode,
        additionalIds,
      };
    };

    // --- Assign players ---
    // Pasar el ID del GoalScorer del tablero actual (el General) y el Nivel del tablero del General
    const generalId = board.idGoalScorer; // Asumimos que idGoalScorer es el ID numérico
    const generalBoardLevelId = levelData?.id; // ID numérico del nivel del tablero actual

    // Use Promise.all to await all async buildPlayer calls
    const playerPositions = [
        'goalScorer', 'creator1', 'creator2', 'generator1', 'generator2', 'generator3', 'generator4',
        'defender1', 'defender2', 'defender3', 'defender4', 'defender5', 'defender6', 'defender7', 'defender8'
    ];
    const playerPromises = playerPositions.map(posKey => { // Cambiado 'pos' a 'posKey' para claridad
        // Construir el nombre de la propiedad del ID: ej, 'id' + 'GoalScorer' -> 'idGoalScorer'
        const idKey = `id${posKey.charAt(0).toUpperCase() + posKey.slice(1)}` as keyof Board;
        const playerId = board[idKey] as number | null;
        // Log para depurar qué IDs se están pasando
        console.log(`[Util - cleanBoardToGetBoardById DEBUG] Mapping position '${posKey}' to ID key '${idKey}', resolved playerId: ${playerId}`);
        return buildPlayer(playerId, generalId, generalBoardLevelId);
    });
    
    const playersArray = await Promise.all(playerPromises);

    playerPositions.forEach((pos, index) => {
        (boardClean as any)[pos] = playersArray[index];
    });

    // **** LOGGING ADDED ****
    console.log(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - Successfully built cleaned board object.`);
    // console.log('[Util - cleanBoardToGetBoardById] Output cleaned board:', JSON.stringify(boardClean, null, 2)); // DEBUG LOG 8 (Optional: puede ser muy verboso)
    console.log('[Util - cleanBoardToGetBoardById] === EXITING SUCCESSFULLY ===');
    // **** END LOGGING ****
  return boardClean;

  } catch (error) {
      console.error(`[Util - cleanBoardToGetBoardById] Board ID: ${board.id} - !!!! ERROR during data fetching or processing !!!!`, error);
      console.log('[Util - cleanBoardToGetBoardById] === EXITING WITH ERROR ===');
      // Return null or throw a custom error, depending on how you want to handle this in the middleware/controller
      return null; // Returning null for simplicity, the middleware should handle this
  }
};

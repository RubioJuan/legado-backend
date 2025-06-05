//Types
import { Request, Response } from "express";
import {
    AssignPlayerRequest,
    UpdatePlayerRequest,
} from "../interfaces/admin.request.interface";
import { GetVerifyBoardMock } from "../interfaces/mock.interface";
import {
    GetVerifyRequest,
    RequestExt,
    RequestGetBoard,
    VerificateRequest,
} from "../interfaces/request";
import {
    GetBoardDataResponse,
    GetVerifyResponse
} from "../interfaces/response";

//Services
import {
    assignPlayerService,
    getStadiumsService,
    massiveAssignPlayersService,
    massiveUpdatePlayersService,
    searchAllBoards,
    searchBoardForGetBoard,
    unlockLowerLevelBoardGenericService,
    verifyPlayerService
} from "../services/board.service";

import { getPlayerDataForResponse } from "../services/player.service";

import { verificatePlayerService, VerificateServiceResponse } from "../services/verificatePlayer.service";

//Utils
import { Board } from "../entities/board.entity";
import { LoginUserData } from "../interfaces/user.interface";
import { handleHttp } from "../utils/error.handle";

export const getBoards = async (req: Request, res: Response) => {
  try {
    const boards = await searchAllBoards();

    return res.send(boards);
  } catch (error) {
    handleHttp(
      res,
      `Has been occurred an error processing  boards search: ${error}`
    );
  }
};

export const getStadiums = async (req: Request, res: Response) => {
  try {
    const response = await getStadiumsService();

    return res.send(response);
  } catch (error) {
    handleHttp(
      res,
      `Has been occurred an error processing  board search: ${error}`
    );
  }
};

export const getBoard = async (req: RequestGetBoard, res: Response) => {
  try {
    const { board, positionOfUser } = req;
    
    // Obtenemos el Board actualizado directamente de la BD para asegurar datos frescos
    const updatedBoardData = await Board.findOne({ where: { id: board.id } });
    
    // Incluimos explícitamente el estado de bloqueo en la respuesta
    const response: GetBoardDataResponse & { 
      currentBlockadeStage: number | null;
      idBoardState: number;
    } = {
      ...board,
      positionOfUser: positionOfUser || null,
      // Añadimos estos campos explícitamente para que el frontend pueda detectar bloqueos
      currentBlockadeStage: updatedBoardData?.currentBlockadeStage || null,
      idBoardState: updatedBoardData?.idBoardState || board.state, // Usamos el valor actualizado
    };

    console.log(`[Controller - getBoard] Sending board data for ID ${board.id}. boardState=${response.idBoardState}, blockadeStage=${response.currentBlockadeStage}`);
    
    return res.status(202).send(response);
  } catch (error) {
    handleHttp(
      res,
      `Has been occurred an error processing  board search: ${error}`
    );
  }
};

export const getVerifyController = async (
  req: GetVerifyRequest,
  res: Response
) => {
  try {
    //Get data for verify
    const defenderData = req.defender;
    const goalScorer = req.goalScorer;
    const boardData: GetVerifyBoardMock = req.board!;

    // Send data to verify player service
    const verifyResponse = await verifyPlayerService(
      goalScorer,
      defenderData,
      boardData
    );

    // Get new data of board for response
    const boardResponse = await searchBoardForGetBoard(boardData.id);

    // Get new data of player for response
    const playerResponse = await getPlayerDataForResponse(
      defenderData.username
    );

    // Response request
    const response: GetVerifyResponse = {
      message: verifyResponse.message,
      data: {
        board: {
          ...boardResponse!,

          positionOfUser: null,
        },
        player: playerResponse,
      },
    };

    return res.send(response);
  } catch (error) {
    return handleHttp(res, `${error}`);
  }
};

export const verificateController = async (
  req: VerificateRequest,
  res: Response
) => {
  console.log("[Controller - Verificate] Entered verificateController.");
  try {
    // Ensure correct types are extracted from req 
    const board = req.boardData! as GetVerifyBoardMock;     
    const defender = req.defender! as LoginUserData;      
    const goalScorer = req.goalScorer! as LoginUserData;  

    console.log("[Controller - Verificate] Extracted data: boardId=", board?.id, "defender=", defender?.username, "goalScorer=", goalScorer?.username);
    if (!board || !defender || !goalScorer) {
      console.error("[Controller - Verificate] Missing data in request object.");
      return res.status(400).json({ message: "Datos incompletos para la verificación." });
    }

    console.log("[Controller - Verificate] Calling verificatePlayerService...");
    const serviceResponse: VerificateServiceResponse = await verificatePlayerService(
      goalScorer,
      defender,
      board
    );
    console.log("[Controller - Verificate] verificatePlayerService responded.", JSON.stringify(serviceResponse));

    // Acceder a los campos directamente desde serviceResponse
    const promotedToBoardId = serviceResponse.promotedToBoardId;
    const splitBoardA_Id = serviceResponse.splitBoardA_Id;
    const splitBoardB_Id = serviceResponse.splitBoardB_Id;

    // Enviar los campos relevantes en el nivel superior de la respuesta JSON
    return res.status(serviceResponse.status).json({
      message: serviceResponse.message,
      promotedToBoardId: promotedToBoardId, // Nivel superior
      splitBoardA_Id: splitBoardA_Id,       // Nivel superior
      splitBoardB_Id: splitBoardB_Id,       // Nivel superior
      // Mantener 'data' como un objeto vacío o no incluirlo si no hay otros datos que anidar.
      // Si el frontend espera 'nextBoard' específicamente, podemos mapear promotedToBoardId a nextBoard aquí.
      // Por consistencia con los nombres de la DB y servicio, usamos promotedToBoardId.
      // Si el frontend espera estrictamente 'nextBoard', entonces sería:
      // nextBoard: promotedToBoardId 
    });
  } catch (error: any) {
     console.error("[Controller - Verificate] Error in controller catch block:", error);
     // *** CREAR PAYLOAD EXPLÍCITO PARA ERROR ***
     const responsePayload = { message: "Ha ocurrido un error inesperado", error: error.message };
     console.log(">>> RESPONSE TO BE SENT (on controller error):", JSON.stringify(responsePayload, null, 2)); 
     // handleHttp podría estar interfiriendo o modificando la respuesta? Lo comentamos por ahora.
     // return handleHttp(res, "Ha ocurrido un error inesperado", error);
     return res.status(500).json(responsePayload); // Devolver error genérico 500
  }
};

export const assignPlayerController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const { goalScorerUsername, playerData } = req.body;

    const response = await assignPlayerService(goalScorerUsername, playerData);

    return res.status(response.status).send({ message: response.message });
  } catch (error) {
    return handleHttp(res, `${error}`);
  }
};

export const massiveAssignPlayersController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const changes: AssignPlayerRequest[] = req.body;

    const response = await massiveAssignPlayersService(changes);

    return res.status(response.status).send({ message: response.message });
  } catch (error) {
    return handleHttp(res, `${error}`);
  }
};

export const massiveUpdatePlayersController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const changes: UpdatePlayerRequest[] = req.body;

    const response = await massiveUpdatePlayersService(changes);

    return res.status(response.status).send({ message: response.message });
  } catch (error) {
    return handleHttp(res, `${error}`);
  }
};

export const unblockHalfArmageddon = async (req: RequestExt, res: Response) => {
  try {
    const { defenderUsername, boardId } = req.body;
    const generalUserId = req.user?.id;

    if (!generalUserId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
        error: {
          code: "UNAUTHORIZED",
          details: "Se requiere autenticación para realizar esta operación"
        }
      });
    }

    if (!defenderUsername || !boardId) {
      return res.status(400).json({
        success: false,
        message: "Datos incompletos",
        error: {
          code: "MISSING_PARAMETERS",
          details: "Se requiere defenderUsername y boardId"
        }
      });
    }

    console.log("[unblockHalfArmageddon] Request:", {
      generalUserId,
      defenderUsername,
      boardId
    });

    // Usar el nuevo servicio genérico que maneja diferentes límites según el nivel
    const result = await unlockLowerLevelBoardGenericService(
      generalUserId,
      defenderUsername,
      boardId
    );

    console.log("[unblockHalfArmageddon] Service response:", result);

    if (!result.success) {
      const statusCode = 
        result.error?.code === "UNAUTHORIZED" ? 403 :
        result.error?.code === "BOARD_NOT_FOUND" || 
        result.error?.code === "DEFENDER_NOT_FOUND" ||
        result.error?.code === "TARGET_BOARD_NOT_FOUND" ? 404 : 400;

      return res.status(statusCode).json(result);
    }

    // Asegurarnos de que la respuesta tenga el formato correcto e incluya maxUnlocks
    const response = {
      success: true,
      message: result.message,
      data: result.data ? {
        username: result.data.username,
        unlockCount: result.data.unlockCount,
        maxUnlocks: result.data.maxUnlocks, // Nuevo campo para mostrar el límite máximo
        state: result.data.state
      } : undefined
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("[unblockHalfArmageddon] Controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        details: error instanceof Error ? error.message : "Error al procesar la solicitud"
      }
    });
  }
};

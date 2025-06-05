// Types
import { NextFunction, Response } from "express";
import { RequestGetBoard } from "../interfaces/request";

// Utils
import { getPositionOfUserV2 } from "../utils/getPositionOfUser";

// Service
import { searchBoardForGetBoard } from "../services/board.service";
import { searchUserByUsername } from "../services/user.service";
import { Role } from "../types/enums.types";

export const matchUserWhitBoard = async (
  req: RequestGetBoard,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get data of user
    const user = req.user!;

    const userData = await searchUserByUsername(user.username);

    // Validate if user exist
    if (!userData)
      return res.status(404).send({ message: "No se encontró el usuario." });

    // Get data of board
    const idBoard = parseInt(req.params.id);

    const board = await searchBoardForGetBoard(idBoard);

    // Validate if board exist
    if (!board)
      return res
        .status(404)
        .send({ message: "No se encontró el campo de juego." });

    if (user.role === Role.PLAYER) {
      // Validate if user is in board
      const { username } = userData;
      console.log(`[Middleware] Checking user: ${username} against board ID: ${idBoard}`);
      console.log('[Middleware] Board data received from service:', JSON.stringify(board, null, 2));

      const position = getPositionOfUserV2(username, board);
      console.log(`[Middleware] Position found for ${username}: ${position}`);

      if (!position){
        console.error(`[Middleware] Unauthorized: User ${username} not found in board ${idBoard}. Board data used:`, JSON.stringify(board, null, 2));
        return res.status(401).send({
          message: "No hay autorización para acceder a este campo de juego.",
        });
      }

      // Save data in request
      req.positionOfUser = position;
    }

    // Save data in request
    req.board = board;

    next();
  } catch (e) {
    return res.status(500).send({ message: "Ocurrio un error inesperado." });
  }
};

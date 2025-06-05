// Types
import { NextFunction, Response } from "express";
import { GetVerifyRequest } from "../interfaces/request";

// Utils
import { getPositionOfUserV2 } from "../utils/getPositionOfUser";

// Service
import { getHydratedBoardForVerification } from "../services/board.service";
import { searchUserByUsername } from "../services/user.service";
import { BoardStateNumericId } from "../types/enums.types";

export const matchDefenderGoalScorer = async (
  req: GetVerifyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user!;

    // Get data of defender
    const defenderData = await searchUserByUsername(user.username);

    // Validate if user exist
    if (!defenderData)
      return res.status(404).send({ message: "No se encontró el defensa." });

    // Validate if is in PROCESS
    if (defenderData.idUserProcessState !== 2)
      return res
        .status(401)
        .send({ message: "No estás habilitado para solicitar verificación." });

    // Get data of board
    const idBoard = parseInt(req.params.id);

    const board = await getHydratedBoardForVerification(idBoard);

    // Validate if board exist
    if (!board)
      return res
        .status(404)
        .send({ message: "No se encontró el campo de juego." });

    // Validate if board is available
    if (board.state === BoardStateNumericId.BLOCKED)
      return res
        .status(400)
        .send({ message: "El campo de juego está bloqueado." });

    if (board.state === BoardStateNumericId.CLOSED)
      return res
        .status(400)
        .send({ message: "El campo de juego no está disponible." });

    // Validate if defender is in board
    const { username } = defenderData;

    const position = getPositionOfUserV2(username, board);

    if (!position)
      return res.status(401).send({
        message: "No hay autorización para acceder a este campo de juego.",
      });

    if (!position.includes("defender"))
      return res
        .status(400)
        .send({ message: "Tu posición no puede solicitar verificación." });

    // Save data in request
    req.board = board;
    req.defender = defenderData;
    req.goalScorer = board.goalScorer;

    next();
  } catch (e) {
    return res.status(500).send({ message: "Ocurrio un error inesperado." });
  }
};

// TYPE
import { NextFunction, Response } from "express";
import { VerificateRequest } from "../interfaces/request";
import { BoardStateNumericId } from "../types/enums.types";

// Handle
import { handleHttp } from "../utils/error.handle";

// SERVICES
import { getHydratedBoardForVerification } from "../services/board.service";

export const verificateBoardData = async (
  req: VerificateRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const idBoard = parseInt(req.params.id);

    // Verify if board exist
    const response = await getHydratedBoardForVerification(idBoard);

    if (!response)
      return res.status(404).send({ mesage: "El campo de juego no existe" });

    if (response.state === BoardStateNumericId.CLOSED)
      return res
        .status(401)
        .send({ message: "El campo de juego está cerrado." });

    // Verificar si el tablero está bloqueado
    if (response.state === BoardStateNumericId.BLOCKED)
      return res
        .status(403)
        .send({ message: "El campo de juego está bloqueado. No puedes verificar reclutas hasta que se desbloquee." });

    // Save data in request
    req.boardData = response;

    // Next
    next();
  } catch (error) {
    handleHttp(res, `Ha ocurrido un error inesperado: ${error}.`);
  }
};

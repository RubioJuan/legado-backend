// Type
import { NextFunction, Response } from "express";
import { GetVerifyGoalScorerMock } from "../interfaces/mock.interface";
import { GetVerifyRequest } from "../interfaces/request";
import { BoardLevel } from "../types/enums.types";

// Utils
import { handleHttp } from "../utils/error.handle";

export const validateTriplicateGetVerifyMiddleware = async (
  req: GetVerifyRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get data to validate from request
    const goalScorer: GetVerifyGoalScorerMock = req.goalScorer;
    const board = req.board!;
    const defender = req.defender;

    // If player has been triplication...
    if (defender.triplicationDone) {
      next();
    } else {
      switch (board.level) {
        case BoardLevel.OLÍMPICO:
          if (goalScorer.ballsReceived === 7 && !goalScorer.triplicationDone)
            return res.status(400).send({
              message:
                "El goleador no ha realizado su tarea, por favor espera.",
            });

          break;

        case BoardLevel.CENTENARIO:
          if (defender.ballsReceivedConfirmed !== 4)
            return res.status(400).send({
              message: "Inscríbete al club goleador para seguir avanzando.",
            });

          break;

        default:
          return res.status(400).send({
            message: "Inscríbete al club goleador para seguir avanzando.",
          });
      }
      next();
    }
  } catch (error) {
    handleHttp(res, `Ha ocurrido un error: ${error}.`);
  }
};

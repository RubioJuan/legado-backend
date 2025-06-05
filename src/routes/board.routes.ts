// Lib
import { Router } from "express";

//Middlewares
import { checkJwt } from "../middlewares/checkSession";
import { isDefender } from "../middlewares/isDefender.middleware";
import { isGoalScorer } from "../middlewares/isGoalScorer.middleware";
import { matchDefenderGoalScorer } from "../middlewares/matchDefenderGoalScorer.middleware";
import { matchUserWhitBoard } from "../middlewares/matchUserWhitBoard";
import { validateTriplicateGetVerifyMiddleware } from "../middlewares/validateTriplicateGetVerify.middleware";
import { verificateBoardData } from "../middlewares/verificateBoardData.middleware";

//Controllers
import {
    getBoard,
    getVerifyController,
    unblockHalfArmageddon,
    verificateController,
} from "../controllers/board.controller";

// Importar el nuevo método del user.controller
import { requestUnlockBySecondaryGeneral } from "../controllers/user.controller";

// Utils

const boardRoutes = Router();

boardRoutes.get("/boards/:id", checkJwt, matchUserWhitBoard, getBoard);

boardRoutes.post(
  "/boards/:id/verify",
  checkJwt,
  matchDefenderGoalScorer,
  validateTriplicateGetVerifyMiddleware,
  getVerifyController
);

boardRoutes.post(
  "/boards/:id/verificate",
  checkJwt,
  verificateBoardData,
  isGoalScorer,
  isDefender,
  verificateController
);

// Ruta para el desbloqueo parcial en Armagedón
boardRoutes.post(
  "/boards/:boardId/unblock-half",
  checkJwt,
  unblockHalfArmageddon
);

// Nueva ruta para solicitar desbloqueo por general secundario
// This route must match exactly what the frontend is calling
// Temporarily removed JWT check for testing
boardRoutes.post(
  "/boards/:recruitBoardId/recruits/:targetRecruitUserId/request-unlock",
  requestUnlockBySecondaryGeneral
);
// End of board unlock route

export { boardRoutes };


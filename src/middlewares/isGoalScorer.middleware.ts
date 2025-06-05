// Type
import { NextFunction, Response } from "express";
import { VerificateRequest } from "../interfaces/request";
import { LoginUserData } from "../interfaces/user.interface";
import { searchUserByUsername } from "../services/user.service";
import { Role } from "../types/enums.types";
import { handleHttp } from "../utils/error.handle";
import { getPositionOfUserV2 } from "../utils/getPositionOfUser";

export const isGoalScorer = async (
  req: VerificateRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('[Middleware - isGoalScorer] FUNCTION CALLED');
  console.log('[Middleware - isGoalScorer] Entered TRY block.');
  try {
    const username = req.user?.username;

    if (!username) {
      console.error('[Middleware - isGoalScorer] Username missing from req.user after checkJwt.');
      return handleHttp(res, "Error interno: Falta el nombre de usuario.", 500);
    }

    const { boardData } = req;

    if (!boardData) {
      console.error('[Middleware - isGoalScorer] boardData missing from req.');
      return handleHttp(res, "Error interno: Faltan datos del tablero.", 500);
    }

    console.log(`[Middleware - isGoalScorer] Checking user: ${username} against board ID: ${boardData.id}`);

    const goalScorerDb = await searchUserByUsername(username);

    if (!goalScorerDb) {
      console.error(`[Middleware - isGoalScorer] GoalScorer ${username} not found in DB.`);
      return handleHttp(res, "Usuario General (GoalScorer) no encontrado.", 404);
    }

    console.log(`[Middleware - isGoalScorer] GoalScorer ${username} found in DB.`);

    const position = getPositionOfUserV2(username, boardData);
    console.log(`[Middleware - isGoalScorer] Position check for ${username} in board ${boardData.id}. Result: ${position}`);

    if (position !== "goalScorer") {
      console.error(`[Middleware - isGoalScorer] User ${username} is not the GoalScorer on board ${boardData.id}. Position: ${position}`);
      return handleHttp(
        res,
        "No eres el General (GoalScorer) de este campo de juego.",
        401
      );
    }

    console.log(`[Middleware - isGoalScorer] User ${username} confirmed as GoalScorer. Attaching data and calling next().`);
    
    let resolvedIdUserState: number = 1; // Valor por defecto
    if (typeof goalScorerDb.idUserState === 'number') {
        resolvedIdUserState = goalScorerDb.idUserState;
    }

    let resolvedIdUserProcessState: number = 1; // Valor por defecto
    if (typeof goalScorerDb.idUserProcessState === 'number') {
        resolvedIdUserProcessState = goalScorerDb.idUserProcessState;
    }

    const goalScorerDataForRequest: LoginUserData = {
      id: goalScorerDb.id,
      firstName: goalScorerDb.firstName,
      lastName: goalScorerDb.lastName,
      username: goalScorerDb.username,
      country: goalScorerDb.country,
      countryCode: goalScorerDb.countryCode,
      phoneNumber: goalScorerDb.phoneNumber,
      role: goalScorerDb.idRole === 1 ? Role.ADMINISTRATOR : Role.PLAYER,
      ballsSended: goalScorerDb.ballsSended,
      ballsReceived: goalScorerDb.ballsReceived,
      ballsReceivedConfirmed: goalScorerDb.ballsReceivedConfirmed,
      acceptMarketing: goalScorerDb.acceptMarketing,
      triplicationDone: goalScorerDb.triplicationDone,
      idUserProcessState: resolvedIdUserProcessState,
      createAt: goalScorerDb.createAt,
      updateAt: goalScorerDb.updateAt,
      idUserState: resolvedIdUserState,
      idLeftAssociation: goalScorerDb.idLeftAssociation || null,
      idRightAssociation: goalScorerDb.idRightAssociation || null,
      idCaptain: goalScorerDb.idCaptain || null,
      triplicationOfId: goalScorerDb.triplicationOfId,
      beneficiatedNames: goalScorerDb.beneficiatedNames ? goalScorerDb.beneficiatedNames[0] : null,
      beneficiatedPhoneNumber: goalScorerDb.beneficiatedPhoneNumber ? goalScorerDb.beneficiatedPhoneNumber[0] : null,
      beneficiatedCountry: goalScorerDb.beneficiatedCountry ? goalScorerDb.beneficiatedCountry[0] : null,
      beneficiatedCountryCode: goalScorerDb.beneficiatedCountryCode ? goalScorerDb.beneficiatedCountryCode[0] : null,
    };
    
    req.goalScorer = goalScorerDataForRequest;
    next();
  } catch (error) {
    console.error(`[Middleware - isGoalScorer] Error during execution: ${error}`);
    handleHttp(res, `Ha ocurrido un error insesperado: ${error}.`);
  }
};

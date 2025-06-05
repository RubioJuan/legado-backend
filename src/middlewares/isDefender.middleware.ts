// Type
import { NextFunction, Response } from "express";
import { VerificateRequest } from "../interfaces/request";
import { LoginUserData } from "../interfaces/user.interface";
import { searchUserByUsername } from "../services/user.service";
import { Role } from "../types/enums.types";
import { handleHttp } from "../utils/error.handle";
import { getPositionOfUserV2 } from "../utils/getPositionOfUser";

export const isDefender = async (
  req: VerificateRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('[Middleware - isDefender] FUNCTION CALLED');
  try {
    console.log('[Middleware - isDefender] Entered TRY block.');
    const { defenderUsername } = req.body;
    const { boardData } = req;

    if (!defenderUsername) {
      console.error('[Middleware - isDefender] defenderUsername missing from req.body.');
      return handleHttp(res, "Falta el nombre de usuario del defensor.", 400);
    }
    if (!boardData) {
      console.error('[Middleware - isDefender] boardData missing from req.');
      return handleHttp(res, "Error interno: Faltan datos del tablero.", 500);
    }
    console.log(`[Middleware - isDefender] Received defender: ${defenderUsername}, Board ID: ${boardData.id}`);

    const defenderDb = await searchUserByUsername(defenderUsername);

    if (!defenderDb) {
      console.error(`[Middleware - isDefender] Defender ${defenderUsername} not found in DB.`);
      return handleHttp(res, "Defensor no encontrado.", 404);
    }
    console.log(`[Middleware - isDefender] Defender ${defenderUsername} found in DB.`);

    const position = getPositionOfUserV2(defenderUsername, boardData);
    console.log(`[Middleware - isDefender] Position check for ${defenderUsername} in board ${boardData.id}. Result: ${position}`);

    if (!position || !position.startsWith("defender")) {
      console.error(`[Middleware - isDefender] User ${defenderUsername} is not a Defender on board ${boardData.id}. Position: ${position}`);
      return handleHttp(
        res,
        "El usuario proporcionado no es un defensor válido en este campo de juego.",
        400
      );
    }

    console.log(`[Middleware - isDefender] User ${defenderUsername} confirmed as Defender. Attaching data and calling next().`);
    
    let resolvedIdUserState: number = 1; // Valor por defecto
    if (typeof defenderDb.idUserState === 'number') {
        resolvedIdUserState = defenderDb.idUserState;
    }
    // Si defenderDb.idUserState es null o undefined, resolvedIdUserState permanece como 1.

    let resolvedIdUserProcessState: number = 1; // Valor por defecto para idUserProcessState
    if (typeof defenderDb.idUserProcessState === 'number') {
        resolvedIdUserProcessState = defenderDb.idUserProcessState;
    }
    // Si defenderDb.idUserProcessState es null o undefined, resolvedIdUserProcessState permanece como 1.

    const defenderDataForRequest: LoginUserData = {
      id: defenderDb.id,
      firstName: defenderDb.firstName,
      lastName: defenderDb.lastName,
      username: defenderDb.username,
      country: defenderDb.country,
      countryCode: defenderDb.countryCode,
      phoneNumber: defenderDb.phoneNumber,
      role: defenderDb.idRole === 1 ? Role.ADMINISTRATOR : Role.PLAYER,
      ballsSended: defenderDb.ballsSended,
      ballsReceived: defenderDb.ballsReceived,
      ballsReceivedConfirmed: defenderDb.ballsReceivedConfirmed,
      acceptMarketing: defenderDb.acceptMarketing,
      triplicationDone: defenderDb.triplicationDone,
      idUserProcessState: resolvedIdUserProcessState, // MODIFIED
      createAt: defenderDb.createAt,
      updateAt: defenderDb.updateAt,
      idUserState: resolvedIdUserState,
      idLeftAssociation: defenderDb.idLeftAssociation || null,
      idRightAssociation: defenderDb.idRightAssociation || null,
      idCaptain: defenderDb.idCaptain || null,
      triplicationOfId: defenderDb.triplicationOfId,
      beneficiatedNames: defenderDb.beneficiatedNames ? defenderDb.beneficiatedNames[0] : null,
      beneficiatedPhoneNumber: defenderDb.beneficiatedPhoneNumber ? defenderDb.beneficiatedPhoneNumber[0] : null,
      beneficiatedCountry: defenderDb.beneficiatedCountry ? defenderDb.beneficiatedCountry[0] : null,
      beneficiatedCountryCode: defenderDb.beneficiatedCountryCode ? defenderDb.beneficiatedCountryCode[0] : null,
    };

    req.defender = defenderDataForRequest;
    next();
  } catch (error) {
    handleHttp(res, `Ha ocurrido un error insesperado: ${error}.`);
  }
};

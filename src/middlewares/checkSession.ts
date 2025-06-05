import { NextFunction, Response } from "express";
import { RequestExt } from "../interfaces/request";
import { LoginUserData } from "../interfaces/user.interface";
import { searchUserById } from "../services/user.service";
import { Role } from "../types/enums.types";
import { verifyToken } from "../utils/jwt.handle";

const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    const jwtByUser = req.headers.authorization || null;
    if (!jwtByUser) return res.status(401).send("No tienes autorización (no header).");

    const jwtParts = jwtByUser.split(" ");
    if (jwtParts.length !== 2 || jwtParts[0].toLowerCase() !== 'bearer') {
        return res.status(401).send("Formato de token inválido.");
    }
    const jwt = jwtParts[1];

    const tokenPayload = verifyToken(jwt); // JWTMock: { id, username, role }

    if (!tokenPayload || typeof tokenPayload.id !== 'number') {
        return res.status(401).send("Token inválido o usuario no identificable.");
    }

    const entityUser = await searchUserById(tokenPayload.id);
    if (!entityUser) {
      return res.status(404).json({ message: "Usuario del token no encontrado." });
    }

    const loginUserData: LoginUserData = {
      id: entityUser.id,
      firstName: entityUser.firstName,
      lastName: entityUser.lastName,
      username: entityUser.username,
      country: entityUser.country,
      countryCode: entityUser.countryCode,
      phoneNumber: entityUser.phoneNumber,
      beneficiatedNames: entityUser.beneficiatedNames ? entityUser.beneficiatedNames[0] : null, 
      beneficiatedPhoneNumber: entityUser.beneficiatedPhoneNumber ? entityUser.beneficiatedPhoneNumber[0] : null,
      beneficiatedCountry: entityUser.beneficiatedCountry ? entityUser.beneficiatedCountry[0] : null,
      beneficiatedCountryCode: entityUser.beneficiatedCountryCode ? entityUser.beneficiatedCountryCode[0] : null,
      ballsSended: entityUser.ballsSended,
      ballsReceived: entityUser.ballsReceived,
      ballsReceivedConfirmed: entityUser.ballsReceivedConfirmed ? 1 : 0,
      acceptMarketing: entityUser.acceptMarketing,
      triplicationDone: entityUser.triplicationDone,
      idUserProcessState: entityUser.idUserProcessState ?? 0,
      createAt: entityUser.createAt,
      updateAt: entityUser.updateAt,
      role: entityUser.idRole === 1 ? Role.ADMINISTRATOR : Role.PLAYER,
      idUserState: entityUser.idUserState,
      idCaptain: entityUser.idCaptain ?? null,
      idBoard: entityUser.subscriptions && entityUser.subscriptions.length > 0 && entityUser.subscriptions[0].board ? entityUser.subscriptions[0].board.id : null,
      triplicationOfId: entityUser.triplicationOfId ?? null,
      idLeftAssociation: entityUser.idLeftAssociation ?? null,
      idRightAssociation: entityUser.idRightAssociation ?? null,
    };

    req.user = loginUserData;
    next();
  } catch (e: any) {
    console.error("[AUTH_MIDDLEWARE_ERROR] Error in checkJwt:", e.message);
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
        return res.status(401).send("Token inválido o expirado.");
    }
    return res.status(500).send("Error interno del servidor durante la autenticación.");
  }
};

const checkJwtAdmin = async (
  req: RequestExt,
  res: Response,
  next: NextFunction
) => {
  try {
    const jwtByUser = req.headers.authorization || null;
    if (!jwtByUser) return res.status(401).send("No tienes autorización (no header admin).");
    
    const jwtParts = jwtByUser.split(" ");
    if (jwtParts.length !== 2 || jwtParts[0].toLowerCase() !== 'bearer') {
        return res.status(401).send("Formato de token inválido (admin).");
    }
    const jwt = jwtParts[1];

    const tokenPayload = verifyToken(jwt); // JWTMock: { id, username, role }

    if (!tokenPayload || typeof tokenPayload.id !== 'number' || typeof tokenPayload.role === 'undefined') {
        return res.status(401).send("Payload de token de administrador inválido o corrupto.");
    }

    if (tokenPayload.role !== Role.ADMINISTRATOR) {
      return res.status(403).send("Permisos insuficientes para esta acción.");
    }
    
    // Note: This middleware currently only validates the role from the token.
    // If admin routes need req.user populated with full user details,
    // 'checkJwt' should run before this, or this middleware should also fetch user details.
    // For example, to ensure the user from the token still exists and is an admin in the DB:
    /*
    const adminUserFromDb = await searchUserById(tokenPayload.id);
    if (!adminUserFromDb || adminUserFromDb.idRole !== Role.ADMINISTRATOR) {
        return res.status(403).send("Usuario no encontrado o ya no es administrador.");
    }
    // Optionally populate req.user if subsequent handlers need it:
    // req.user = { ...map adminUserFromDb to LoginUserData... };
    */

    next();
  } catch (e: any) {
    console.error("[AUTH_MIDDLEWARE_ERROR] Error in checkJwtAdmin:", e.message);
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
        return res.status(401).send("Token de administrador inválido o expirado.");
    }
    return res.status(500).send("Error interno del servidor durante la autenticación de administrador.");
  }
};

export { checkJwt, checkJwtAdmin };


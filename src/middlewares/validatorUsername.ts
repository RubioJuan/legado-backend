import { NextFunction, Response } from "express";
import { RequestExt } from "../interfaces/request";
import { checkUsername } from "../services/user.service";
import { handleHttp } from "../utils/error.handle";

const validatorUsername = async (
  req: RequestExt,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.body;

    if (username !== undefined) {
      const userExist = await checkUsername(username);

      if (!userExist) {
        next();
      } else {
        return res.status(409).json({ message: "El nombre de usuario está en uso" });
      }
    } else {
      return res.status(400).json({ message: "Nombre de usuario requerido" });
    }
  } catch (e) {
    handleHttp(res, `ERROR IN THE USERNAME VALIDATE PROCESS: ${e}`);
  }
};

export { validatorUsername };


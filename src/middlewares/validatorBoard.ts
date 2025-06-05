import { NextFunction, Response } from "express";
import { RequestExt } from "../interfaces/request";
import { handleHttp } from "../utils/error.handle";

const validatorBoard = async (
  req: RequestExt,
  res: Response,
  next: NextFunction
) => {
  try {
    next();
  } catch (error) {
    handleHttp(res, `ERROR IN THE BOARD VALIDATE PROCESS: ${error}`);
  }
};

export { validatorBoard };

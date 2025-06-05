//Type
import { Request } from "express";
import { PositionOfUser } from "../types/index.types";
import { GetVerifyBoardMock, /* JWTMock */ } from "./mock.interface"; // JWTMock ya no se usa aquí directamente para user
import { LoginUserData } from "./user.interface";

export interface RequestExt extends Request {
  user?: LoginUserData;
}

export interface RequestGetBoard extends Request {
  board?: any;
  user?: LoginUserData;
  positionOfUser?: PositionOfUser;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface GetVerifyRequest extends RequestExt {
  defender?: any;
  board?: GetVerifyBoardMock;
  goalScorer?: GetVerifyGoalScorerMock;
  playerSelected?: any;
  body: {};
}

export interface VerificateRequest extends RequestExt {
  goalScorerData?: any;
  defenderData?: any;
  boardData?: GetVerifyBoardMock;
  defender?: LoginUserData;
  goalScorer?: LoginUserData;
  body: {
    defenderUsername: string;
  };
}

// Type
import {
    Role
} from "../types/enums.types";
import { BoardMock, GetBoardMock } from "./mock.interface";
import { PositionOfUser } from "./request";

export interface LoginResponse {
  token: string;
  userData: any;
  role: Role;
}

export interface GetSubscriptionsResponse {
  olímpico?: BoardMock;
  centenario?: BoardMock;
  azteca?: BoardMock;
  monumental?: BoardMock;
}

export interface GetBoardDataResponse extends GetBoardMock {
  positionOfUser: PositionOfUser;
}

export interface GetVerifyResponse {
  message: string;
  data: { board: GetBoardDataResponse; player: any };
}

export interface CreateStadiumResponse extends BaseResponse {
  // ... existing code ...
}

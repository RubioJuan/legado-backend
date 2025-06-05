import { BoardState } from "../entities/board-state.entity";
import { EntityUser } from "../entities/user.entity";

export interface Board {
  id: number;
  idGoalScorer?: number | null;
  idCreator1?: number | null;
  idCreator2?: number | null;
  idGenerator1?: number | null;
  idGenerator2?: number | null;
  idGenerator3?: number | null;
  idGenerator4?: number | null;
  idDefender1?: number | null;
  idDefender2?: number | null;
  idDefender3?: number | null;
  idDefender4?: number | null;
  idDefender5?: number | null;
  idDefender6?: number | null;
  idDefender7?: number | null;
  idDefender8?: number | null;
  idLevel: number;
  idBoardState: number;
  createAt: Date;
  updateAt: Date;
}

export interface BoardExt {
  id: number;
  idGoalScorer?: EntityUser;
  idCreator1?: EntityUser;
  idCreator2?: EntityUser;
  idGenerator1?: EntityUser;
  idGenerator2?: EntityUser;
  idGenerator3?: EntityUser;
  idGenerator4?: EntityUser;
  idDefender1?: EntityUser;
  idDefender2?: EntityUser;
  idDefender3?: EntityUser;
  idDefender4?: EntityUser;
  idDefender5?: EntityUser;
  idDefender6?: EntityUser;
  idDefender7?: EntityUser;
  idDefender8?: EntityUser;
  idLevel: Level | number;
  idBoardState: BoardState;
  createAt: Date;
  updateAt: Date;
}

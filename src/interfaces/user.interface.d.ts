import { UserProcessState } from "../entities/user-process-state.entity";
import { UserState } from "../entities/user-state.entity";
import { EntityUser } from "../entities/user.entity";
import { Role } from "../types/enums.types";

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  username: string;
  password: string;
  //   // walletAddress: string;
  beneficiatedNames?: string[] | null;
  beneficiatedPhoneNumber?: string[] | null;
  beneficiatedCountry?: string[] | null;
  beneficiatedCountryCode?: string[] | null;
  acceptMarketing?: boolean;
  idRole?: number;
  idUserState?: number;
  idUserProcessState?: number;
  idLeftAssociation?: number;
  idRightAssociation?: number;
  idCaptain?: number;
  securityQuestion?: string;
  securityAnswer?: string;
  creatorUserId?: number;
}

export interface UserExt {
  id?: number;
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  username: string;
  password: string;
  //   // walletAddress: string;
  beneficiatedNames?: string[] | null;
  beneficiatedPhoneNumber?: string[] | null;
  beneficiatedCountry?: string[] | null;
  beneficiatedCountryCode?: string[] | null;
  acceptMarketing?: boolean;
  idRole?: Role;
  idUserState?: UserState;
  idUserProcessState?: UserProcessState;
  idLeftAssociation?: EntityUser;
  idRightAssociation?: EntityUser;
  idCaptain?: EntityUser;
}

export type PositionType =
  | "idGoalScorer"
  | "idCreator1"
  | "idCreator2"
  | "idGenerator1"
  | "idGenerator2"
  | "idGenerator3"
  | "idGenerator4"
  | "idDefender1"
  | "idDefender2"
  | "idDefender3"
  | "idDefender4"
  | "idDefender5"
  | "idDefender6"
  | "idDefender7"
  | "idDefender8";

export interface LoginUserData {
  id: number;
  firstName: string;
  lastName: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  username: string;
  password?: string;
  ballsSended: number;
  ballsReceived: number;
  ballsReceivedConfirmed: number;
  beneficiatedNames?: string | null;
  beneficiatedPhoneNumber?: string | null;
  beneficiatedCountry?: string | null;
  beneficiatedCountryCode?: string | null;
  acceptMarketing: boolean;
  triplicationDone: boolean;
  idUserProcessState: number;
  createAt: Date;
  updateAt: Date;
  role: Role;
  idUserState: number;
  idLeftAssociation: number | null;
  idRightAssociation: number | null;
  idCaptain: number | null;
  idBoard?: number | null;
  triplicationOfId?: number | null;
  userProcessState?: UserProcessState;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  username: string;
  email: string; // username serves as email
  phoneNumber: string;
  securityQuestion?: string | null;
  // ❌ NOTA DE SEGURIDAD: 
  // password y securityAnswer NO se incluyen en respuestas GET por seguridad
  // Solo se pueden enviar en requests PUT para actualización
  paymentMethods?: Array<{ 
    type: string; 
    value: string; 
    accountType?: string; 
    [key: string]: any 
  }> | null;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string; // username serves as email
  phoneNumber?: string;
  securityQuestion?: string;
  securityAnswer?: string; // Solo para actualización, nunca se devuelve en GET
  paymentMethods?: Array<{ 
    type: string; 
    value: string; 
    accountType?: string; 
    [key: string]: any 
  }>;
}

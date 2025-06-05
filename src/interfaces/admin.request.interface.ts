import { User } from "./user.interface";

export interface AssignPlayerRequest {
  goalScorerUsername: string;
  playerData: User;
}

export interface ServiceResponse {
  message: string;
  status: number;
}

export interface DeleteUserByUsernameRequest {
  username: string;
  goalScorerUsername?: string;
}

export interface AdminUserChangeRequest {
  username: string;
  newPassword: string;
}

export interface UpdatePlayerRequest {
  playerUsername: string;
  newPlayerData: FormUpdatePlayer;
}

export interface FormUpdatePlayer {
  firstName?: string;
  lastName?: string;
  country?: string;
  countryCode?: string;
  phoneNumber?: string;
  username?: string;
  password?: string;
  beneficiatedNames?: string;
  beneficiatedPhoneNumber?: string;
  beneficiatedCountry?: string;
  beneficiatedCountryCode?: string;
  acceptMarketing?: boolean;
}

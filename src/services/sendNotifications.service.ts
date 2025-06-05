import { PasswordResetTokens } from "../entities/password_reset_tokens.entity";
import { generateTokenForRecoveryPassword } from "../utils/jwt.handle";

export const saveTokenToRecoveryPassword = async (
  idUser: number,
) => {
  const token = generateTokenForRecoveryPassword(`${idUser}`);
  // Crea un nuevo registro en la tabla "password_reset_tokens"
  const newPasswordResetTokens = new PasswordResetTokens();
  newPasswordResetTokens.idUser = idUser;
  newPasswordResetTokens.token = token;
  const sendToken = await newPasswordResetTokens.save();
  return sendToken;
};

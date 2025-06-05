import { Request, Response } from "express";
import { RequestExt } from "../interfaces/request";

//Services
import { saveTokenToRecoveryPassword } from "../services/sendNotifications.service";
import { notificateRecoveryPassword } from "../services/sms.twilio.service";
import {
    searchUserByUsername,
    userPasswordRecovery,
} from "../services/user.service";

const passwordResetTokenUser = async (req: Request, res: Response) => {
  const username = req.body.username;

  const user = await searchUserByUsername(username);

  if (!user) {
    return res.send("El usuario no existe");
  } else {
    const generateToken = await saveTokenToRecoveryPassword(user.id);
    const { token } = generateToken;

    await notificateRecoveryPassword(user.phoneNumber, token);

    return res.send(
      "Enviamos un SMS al numero de teléfono asociado para reestablecer tu contraseña, recuerda que tienes 1 hora para completar el proceso"
    );
  }
};

const changePassword = async (req: RequestExt, res: Response) => {
  const token = req.body.token;
  const newPassword = req.body.newPassword;
  const idUser = req.user?.id!;

  const response = await userPasswordRecovery(idUser, token, newPassword);

  return res.send(response);
};

export { changePassword, passwordResetTokenUser };


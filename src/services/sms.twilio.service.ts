import { Twilio } from "twilio";
import {
  ADMIN_PHONENUMBER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} from "../config/config";

const twilioService = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const notificateGetVerify = async (
  responseFromServer: string,
  goalScorer: any,
  defender: any
) => {
  try {
    if (
      responseFromServer ===
      "Éxito, se ha realizado la solicitud de validación."
    ) {
      await twilioService.messages.create({
        body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación.`,
        from: TWILIO_PHONE_NUMBER,
        to: goalScorer.phoneNumber,
      });

      // await twilioService.messages.create({
      //   body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación a ${goalScorer.username}.`,
      //   from: TWILIO_PHONE_NUMBER,
      //   to: ADMIN_PHONENUMBER,
      // });
    }

    if (
      responseFromServer ===
      "Éxito, se ha realizado la solicitud de validación, el tablero ha sido bloqueado."
    ) {
      await twilioService.messages.create({
        body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación, envia tu balón al goleador del siguiente nivel para subscribirte.`,
        from: TWILIO_PHONE_NUMBER,
        to: goalScorer.phoneNumber,
      });

      // await twilioService.messages.create({
      //   body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación a ${goalScorer.username} el tablero se mantendra bloqueado hasta que envie su balón.`,
      //   from: TWILIO_PHONE_NUMBER,
      //   to: ADMIN_PHONENUMBER,
      // });
    }
    if (
      responseFromServer ===
      "Éxito, se ha realizado la solicitud de validación."
    ) {
      await twilioService.messages.create({
        body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación.`,
        from: TWILIO_PHONE_NUMBER,
        to: goalScorer.phoneNumber,
      });

      // await twilioService.messages.create({
      //   body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación a ${goalScorer.username}.`,
      //   from: TWILIO_PHONE_NUMBER,
      //   to: ADMIN_PHONENUMBER,
      // });
    }

    if (
      responseFromServer ===
      "Éxito, se ha realizado la solicitud de validación, el tablero ha sido bloqueado."
    ) {
      await twilioService.messages.create({
        body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación, envia tu balón al goleador del siguiente nivel para subscribirte.`,
        from: TWILIO_PHONE_NUMBER,
        to: goalScorer.phoneNumber,
      });

      // await twilioService.messages.create({
      //   body: `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación a ${goalScorer.username} el tablero se mantendra bloqueado hasta que envie su balón.`,
      //   from: TWILIO_PHONE_NUMBER,
      //   to: ADMIN_PHONENUMBER,
      // });
    }
  } catch (error) {
    console.error(error);
  }
};

export const notificateCloseBoard = async (board: any) => {
  try {
    await twilioService.messages.create({
      body: `El tablero donde eras Creador se ha cerrado, ${board.idCreator1.username} has sido promovido a la posicion de Goleador.`,
      from: TWILIO_PHONE_NUMBER,
      to: board.idCreator1.phoneNumber,
    });

    await twilioService.messages.create({
      body: `El tablero donde eras Creador se ha cerrado, ${board.idCreator2.username} has sido promovido a la posicion de Goleador.`,
      from: TWILIO_PHONE_NUMBER,
      to: board.idCreator2.phoneNumber,
    });
  } catch (error) {
    console.error(error);
  }
};

export const notificateSendBall = async (goalScorer: any, defender: any) => {
  try {
    await twilioService.messages.create({
      body: `Movimiento en el campo de juego, El goleador te ha validado.`,
      from: TWILIO_PHONE_NUMBER,
      to: defender.phoneNumber,
    });

    // await twilioService.messages.create({
    //   body: `Movimiento en el campo de juego,  el usuario ${defender.username} has sido verificado, el goleador ${goalScorer.username} ahora debe enviar su balón.`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: ADMIN_PHONENUMBER,
    // });
  } catch (error) {
    console.error(error);
  }
};

export const notificateAcceptVerificate = async (
  goalScorer: any,
  defender: any
) => {
  try {
    await twilioService.messages.create({
      body: `Movimiento en el campo de juego, El goleador te ha validado.`,
      from: TWILIO_PHONE_NUMBER,
      to: defender.phoneNumber,
    });

    // await twilioService.messages.create({
    //   body: `Movimiento en el campo de juego,  el usuario ${defender.username} has sido verificado.`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: ADMIN_PHONENUMBER,
    // });
  } catch (error) {
    console.error(error);
  }
};

export const notificateRejectValidate = async (
  goalScorer: any,
  defender: any
) => {
  try {
    await twilioService.messages.create({
      body: `Alerta!!!, El goleador ${goalScorer.username} ha rechazado tu validacion.`,
      from: TWILIO_PHONE_NUMBER,
      to: defender.phoneNumber,
    });

    // await twilioService.messages.create({
    //   body: `Alerta!!!, El goleador ${goalScorer.username} ha rechazado la validacion de ${defender.username}.`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: ADMIN_PHONENUMBER,
    // });
  } catch (error) {
    console.error(error);
  }
};

export const notificateRecoveryPassword = async (
  cellPhone: string,
  token: string
) => {
  try {
    await twilioService.messages.create({
      body: `Haga clic en el siguiente enlace para restablecer su contraseña: https://www.legadodeamormundial.com/change-password?token=${token} .`,
      from: TWILIO_PHONE_NUMBER,
      to: cellPhone,
    });
  } catch (error) {
    console.error(error);
  }
};

export const notificateGotOutTail = async (user: any) => {
  try {
    const { username, phoneNumber, firstName } = user;
    await twilioService.messages.create({
      body: `Felicidades ${firstName}, tu usuario ${username} ha sido asignado a un campo de juego.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  } catch (error) {
    console.error(error);
  }
};

// export const sendSMS = async (text: string, to: string) => {
//   try {
//     await twilioService.messages
//       .create({
//         body: text,
//         from: TWILIO_PHONE_NUMBER,
//         to: to,
//       })
//       .then((message) => {
//         return message;
//       });
//   } catch (error) {
//     console.error(error);
//   }
// };

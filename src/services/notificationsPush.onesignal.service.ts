import { Client } from "onesignal-node";

import { APP_ID_ONESIGNAL, REST_API_KEY_ONESIGNAL } from "../config/config";

const onesignalClient = new Client(APP_ID_ONESIGNAL, REST_API_KEY_ONESIGNAL);

// export const sendNotification = async (
//   playerIds: string[],
//   notification: any
// ) => {
//   try {
//     // await = client.

//     const response = await onesignalClient.createNotification({
//       include_player_ids: playerIds,
//       ...notification,
//     });

//     console.log("Notification sent:", response);
//   } catch (error) {
//     console.error("Error sending notification:", error);
//   }
// };

// export const insertSubscriptionOneSignal = async (
//   playerId: string,
//   externalUserId: string
// ) => {
//   const newSubscription = new OneSignal();
//   newSubscription.playerId = playerId;
//   newSubscription.externalUserId = externalUserId;
//   await newSubscription.save();
// };

// export const searchSubscriptionsOfOneSignal = async (
//   username: string,
//   playerId: string
// ) => {
//   const response = await OneSignal.find({
//     where: {
//       externalUserId: username,
//       playerId,
//     },
//   });

//   return response;
// };

export const sendPushNotification = async (
  username: string,
  message: string
) => {
  try {
    const notification = {
      contents: { en: message },
      include_external_user_ids: [username],
    };

    await onesignalClient.createNotification(notification);
  } catch (error) {
    console.error(error);
  }
};

export const notificatePushGetVerify = async (
  responseFromServer: string,
  goalScorer: any,
  defender: any
) => {
  try {
    if (
      responseFromServer ===
      "Éxito, se ha realizado la solicitud de validación."
    ) {
      await sendPushNotification(
        goalScorer.username,
        `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación.`
      );

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
      await sendPushNotification(
        goalScorer.username,
        `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación, envia tu balón al goleador del siguiente nivel para subscribirte.`
      );

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
      await sendPushNotification(
        goalScorer.username,
        `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación.`
      );

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
      await sendPushNotification(
        goalScorer.username,
        `Movimiento en el campo de juego, el usuario ${defender.username}, ha solicitado verificación, envia tu balón al goleador del siguiente nivel para subscribirte.`
      );

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

export const notificatePushCloseBoard = async (board: any) => {
  try {
    await sendPushNotification(
      board.idCreator1.username,
      `El tablero donde eras Creador se ha cerrado, ${board.idCreator1.username} has sido promovido a la posicion de Goleador.`
    );

    await sendPushNotification(
      board.idCreator2.username,
      `El tablero donde eras Creador se ha cerrado, ${board.idCreator2.username} has sido promovido a la posicion de Goleador.`
    );
  } catch (error) {
    console.error(error);
  }
};

export const notificatePushSendBall = async (
  goalScorer: any,
  defender: any
) => {
  try {
    await sendPushNotification(
      defender.username,
      `Movimiento en el campo de juego, El goleador ${goalScorer.username} te ha validado.`
    );

    // await twilioService.messages.create({
    //   body: `Movimiento en el campo de juego,  el usuario ${defender.username} has sido verificado, el goleador ${goalScorer.username} ahora debe enviar su balón.`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: ADMIN_PHONENUMBER,
    // });
  } catch (error) {
    console.error(error);
  }
};

export const notificatePushAcceptVerificate = async (
  goalScorer: any,
  defender: any
) => {
  try {
    await sendPushNotification(
      defender.username,
      `Movimiento en el campo de juego, El goleador ${goalScorer.username} te ha validado.`
    );

    // await twilioService.messages.create({
    //   body: `Movimiento en el campo de juego,  el usuario ${defender.username} has sido verificado.`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: ADMIN_PHONENUMBER,
    // });
  } catch (error) {
    console.error(error);
  }
};

export const notificatePushRejectValidate = async (
  goalScorer: any,
  defender: any
) => {
  try {
    await sendPushNotification(
      defender.username,
      `Alerta!!!, El goleador ${goalScorer.username} ha rechazado tu validacion.`
    );

    // await twilioService.messages.create({
    //   body: `Alerta!!!, El goleador ${goalScorer.username} ha rechazado la validacion de ${defender.username}.`,
    //   from: TWILIO_PHONE_NUMBER,
    //   to: ADMIN_PHONENUMBER,
    // });
  } catch (error) {
    console.error(error);
  }
};

export const notificatePushGotOutTail = async (user: any) => {
  try {
    const { username, firstName } = user;
    await sendPushNotification(
      username,
      `Felicidades ${firstName}, tu usuario ${username} ha sido asignado a un campo de juego.`
    );
  } catch (error) {
    console.error(error);
  }
};

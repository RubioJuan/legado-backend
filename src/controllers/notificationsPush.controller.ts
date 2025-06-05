// import { Request, Response } from "express";
// import { client } from "../services/push.service";
// import { RequestExt } from "../interfaces/req-ext";

import { Request, Response } from "express";
import { sendPushNotification } from "../services/notificationsPush.onesignal.service";
import { handleHttp } from "../utils/error.handle";

// import { searchUserById } from "../services/user.service";

// export const notificationsPushController = async (
//   req: RequestExt,
//   res: Response
// ) => {
//   const { playerId } = req.body;
//   const userId = parseInt(req.user?.id);
//   const user = await searchUserById(userId);
//   const username = user!.username;

//   const subscriptions = await searchSubscriptionsOfOneSignal(
//     username,
//     playerId
//   );

//   if (!!subscriptions && subscriptions.length > 0) {
//     // const notification = {
//     //   headings: { es: "¡Hola!", en: "Hi" },
//     //   contents: {
//     //     es: "Se ha agregado este dispositivo para recibir notificaciones",
//     //     en: "This device has been added to receive notifications",
//     //   },
//     // };
//     return res.status(304);
//   } else {
//     await insertSubscriptionOneSignal(playerId, username);
//     const notification = {
//       headings: { es: "¡Hola!", en: "Hi" },
//       contents: {
//         es: "Gracias por subscribirte, te mantendremos al tanto de todos los movimientos en el campo de juego.",
//         en: "Thanks for subscribing, we will keep you up to date with all the movements on the field of play.",
//       },
//     };
//     await sendNotification([playerId], notification);
//     return res.status(200);
//   }
// };

export const sendNotificationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { username, message } = req.body;
    await sendPushNotification(username, message);
    return res.send("Notificación enviada correctamente.");
  } catch (error) {
    handleHttp(res, `${error}`);
  }
};

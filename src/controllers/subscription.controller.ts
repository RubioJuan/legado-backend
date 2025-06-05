import { Response } from "express";
import { RequestExt } from "../interfaces/request";
import { searchSubscriptionsOfUser } from "../services/board.service";

export const getSubscriptions = async (req: RequestExt, res: Response) => {
  try {
    const idUser = req.user!.id;

    const subscriptions = await searchSubscriptionsOfUser(idUser);
    return res.send(subscriptions);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

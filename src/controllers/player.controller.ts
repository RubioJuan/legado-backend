//Types
import { Response } from "express";
import { RequestExt } from "../interfaces/request";

//Services
import { searchSubscriptionsOfUser } from "../services/board.service";
import { insertTriplicationService } from "../services/player.service";

export const triplicationController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const currentUserId = req.user?.id!;

    const { listUserData } = req.body;

    const response = await insertTriplicationService(currentUserId, listUserData);

    if (response.success) {
      return res.send({ message: response.message });
    } else {
      return res.status(400).send({ message: response.message });
    }
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

export const getSubscriptionsController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    //Get id of user
    const idUser = req.user!.id;

    //Search boards available by id of user
    const subscriptions = await searchSubscriptionsOfUser(idUser);

    //Return subscriptions of user
    return res.send(subscriptions);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).send({ message: error.message });
    }
  }
};

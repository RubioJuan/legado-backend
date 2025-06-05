import { In, QueryRunner } from "typeorm"
import { AppDataSource } from "../config/db"
import { Subscription } from "../entities/subscription.entity"

/**
 * Creates a new subscription for a user to a board.
 * Assumes idSubscriptionState = 1 means 'Active'.
 * @param userId The ID of the user.
 * @param boardId The ID of the board.
 * @param idSubscriptionState The state of the subscription (e.g., 1 for Active).
 * @param queryRunner The QueryRunner to use for the transaction.
 */
export const createSubscription = async (
  userId: number,
  boardId: number,
  idSubscriptionState: number, // Assuming 1 is Active, adjust if necessary
  queryRunner: QueryRunner
): Promise<Subscription> => {
  try {
    const subscriptionRepository = queryRunner.manager.getRepository(Subscription)
    const newSubscription = subscriptionRepository.create({
      idUser: userId,
      idBoard: boardId,
      idSubscriptionState: idSubscriptionState,
    })
    await subscriptionRepository.save(newSubscription)
    console.log(`[Service - createSubscription] Subscription created for User ID: ${userId} to Board ID: ${boardId}`)
    return newSubscription
  } catch (error) {
    console.error(`[Service - createSubscription] Error creating subscription for User ID: ${userId}, Board ID: ${boardId}:`, error)
    throw new Error(`Error creating subscription: ${error}`)
  }
}

/**
 * Finds all subscriptions for a given user.
 * This will be used by the existing searchSubscriptionsOfUser logic,
 * but that logic might need to be moved/adjusted to use this service.
 * For now, this is a placeholder if we want to centralize subscription reads.
 */
export const findSubscriptionsByUserId = async (userId: number): Promise<Subscription[]> => {
  const subscriptionRepository = AppDataSource.getRepository(Subscription)
  return await subscriptionRepository.find({
    where: { idUser: userId },
    relations: ["idBoard", "idBoard.idLevel", "idBoard.idBoardState", "idSubscriptionState"],
  })
}

export const findSubscriptionsByIdUser = async ( idUser: number ) => {
  try {
    const subscriptionsByIdUser = await Subscription.find( {
      select: {
        id: true,
        idBoard: true,
        idSubscriptionState: true,
        idUser: true,
      },
      where: {
        idUser: In( [idUser] ),
      },
    } )
    return subscriptionsByIdUser
  } catch ( error ) {
    console.error( error )
    return null
  }
}

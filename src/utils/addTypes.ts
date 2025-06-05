import { UserState } from "../entities/user-state.entity";
import { BoardState } from "../entities/board-state.entity";
import { SubscriptionState } from "../entities/subscription-state.entity";
import { Level } from "../entities/level.entity";
import { Role } from "../entities/role.entity";
import { UserProcessState } from "../entities/user-process-state.entity";

export const addTypesByDefault = async () => {
  const firstStartValidator = await BoardState.find({ take: 1 });

  if (firstStartValidator.length === 0) {
    const userStateActive = new UserState();
    userStateActive.name = "ACTIVE";
    await userStateActive.save();

    const userStateBlock = new UserState();
    userStateBlock.name = "BLOCKED";
    await userStateBlock.save();

    const userProcessStateWaiting = new UserProcessState();
    userProcessStateWaiting.name = "WAITING";
    await userProcessStateWaiting.save();

    const userProcessStateProcess = new UserProcessState();
    userProcessStateProcess.name = "PROCESS";
    await userProcessStateProcess.save();

    const userProcessStateValidating = new UserProcessState();
    userProcessStateValidating.name = "VALIDATING";
    await userProcessStateValidating.save();

    const userProcessStateValidated = new UserProcessState();
    userProcessStateValidated.name = "VALIDATED";
    await userProcessStateValidated.save();

    const userProcessStateBlock = new UserProcessState();
    userProcessStateBlock.name = "BLOCKED";
    await userProcessStateBlock.save();

    const boardStateWaiting = new BoardState();
    boardStateWaiting.name = "WAITING";
    await boardStateWaiting.save();

    const boardStateProcess = new BoardState();
    boardStateProcess.name = "PROCESS";
    await boardStateProcess.save();

    const boardStateBlock = new BoardState();
    boardStateBlock.name = "BLOCKED";
    await boardStateBlock.save();

    const boardStateClosed = new BoardState();
    boardStateClosed.name = "CLOSED";
    await boardStateClosed.save();

    const subscriptionStateActive = new SubscriptionState();
    subscriptionStateActive.name = "ACTIVE";
    await subscriptionStateActive.save();

    const subscriptionStateClosed = new SubscriptionState();
    subscriptionStateClosed.name = "CLOSED";
    await subscriptionStateClosed.save();

    const subscriptionStateBlocked = new SubscriptionState();
    subscriptionStateBlocked.name = "BLOCKED";
    await subscriptionStateBlocked.save();

    const levelOlimpico = new Level();
    levelOlimpico.name = "OLÍMPICO";
    await levelOlimpico.save();

    const levelCentenario = new Level();
    levelCentenario.name = "CENTENARIO";
    await levelCentenario.save();

    const levelAzteca = new Level();
    levelAzteca.name = "AZTECA";
    await levelAzteca.save();

    const levelMonumental = new Level();
    levelMonumental.name = "MONUMENTAL";
    await levelMonumental.save();

    const roleAdministrator = new Role();
    roleAdministrator.name = "ADMINISTRATOR";
    await roleAdministrator.save();

    const rolePlayer = new Role();
    rolePlayer.name = "PLAYER";
    await rolePlayer.save();
  }
};

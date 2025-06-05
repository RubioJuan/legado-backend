import { Tail } from "../entities/tail.entity";

export const insertUserInTail = async (idUser: number) => {
  try {
    const tailUser = new Tail();
    tailUser.idUser = idUser;
    const response = await tailUser.save();
    return response;
  } catch (error) {
    return null;
  }
};

export const getUserTailToInsertOnNewBoard = async () => {
  const tail = await Tail.find({
    order: { createAt: "ASC" },
    take: 16,
    relations: ["idUser"],
  });
  const elementsByArray = 8;
  const response = [];

  for (let i = 0; i < tail.length; i += elementsByArray) {
    response.push(tail.slice(i, i + elementsByArray));
  }
  return response;
};

export const eraseUserTailByIdTail = async (idTail: number) => {
  await Tail.delete(idTail);
};

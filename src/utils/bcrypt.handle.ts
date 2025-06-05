import { hash, compare } from "bcrypt";

const encrypt = async (pass: string) => {
  const passwordHash: string = await hash(pass, 10);
  return passwordHash;
};

const verified = async (pass: string, passHash: string) => {
  const isCorrect: boolean = await compare(pass, passHash);
  return isCorrect;
};

export { encrypt, verified };

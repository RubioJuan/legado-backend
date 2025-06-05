export const getUserDataInfo = (tail: any) => {
  const user: {
    id: number;
    firstName: string,
    phoneNumber: string;
    username: string;
  } = tail.idUser;

  return user;
};

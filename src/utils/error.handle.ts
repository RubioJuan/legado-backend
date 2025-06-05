import { Response } from "express";

const handleHttp = (res: Response, error: string, errorCode?: number) => {
  if (errorCode !== undefined) {
    res.status(errorCode);
  } else {
    res.status(500);
  }

  res.send({ error });
};

export { handleHttp };

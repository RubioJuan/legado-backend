// Lib
import { sign, verify } from "jsonwebtoken";

// Type
import { JWTMock } from "../interfaces/mock.interface";

// Config
import { JWT_SECRET } from "../config/config";

const generateToken = (userData: JWTMock) => {
  const jwt = sign(userData, JWT_SECRET, {
    expiresIn: "4h",
  });
  return jwt;
};

const generateTokenForRecoveryPassword = (id: string | object) => {
  const jwt = sign({ id }, JWT_SECRET, {
    expiresIn: "1h",
  });
  return jwt;
};

const verifyToken = (jwt: string) => {
  const tokenData: JWTMock = verify(jwt, JWT_SECRET) as JWTMock;
  return tokenData;
};

export { generateToken, generateTokenForRecoveryPassword, verifyToken };

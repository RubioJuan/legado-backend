// Type
import { Request, Response } from "express";
import { LoginRequest } from "../interfaces/request";
import { LoginResponse } from "../interfaces/response";
import { Role } from "../types/enums.types";

//Services
import {
  adminLoginService,
  searchUserByUsername,
} from "../services/user.service";

//Utils
import { verified } from "../utils/bcrypt.handle";
import { handleHttp } from "../utils/error.handle";
import { generateToken } from "../utils/jwt.handle";

import {
  changePasswordService,
  getSecurityQuestionService,
  loginService,
  resetPasswordService,
  verifySecurityAnswerService
} from '../services/auth.service';

import { LoginUserData } from '../interfaces/user.interface'; // For typing JWT payload

// Extend Express Request type to include user from JWT
export interface AuthenticatedRequest extends Request {
  user?: LoginUserData; // Payload from JWT { id: number, username: string, role: number ...etc}
}

const loginCtrl = async (req: Request, res: Response) => {
  try {
    //Receive request.
    const loginData: LoginRequest = req.body;

    //TODO: Create a new service that reply only necessary information according whit interface.
    //Search user by username to verify that user exist.
    const user = await searchUserByUsername(loginData.username);

    //Reject request whit status code 404 if user don't exist.
    if (!user) return res.status(404).send("Nombre de usuario invalido.");

    //Reject request whit status code 400 if user is blocked.
    if (user.idUserState === 2)
      return res.status(400).send("Usuario bloqueado.");

    //Get password encrypted.
    const passwordCrypt = user.password;

    //Verify password is correct.
    const isCorrect = await verified(loginData.password, passwordCrypt);

    //Reject request whit status code 401 if password is wrong.
    if (!isCorrect) return res.status(401).send("Contraseña incorrecta.");

    //Get user data and save on new variable to delete unnecessary information.
    const userData: any = {
      ...user,
    };

    //Get role
    const role = userData.idRole === 1 ? Role.ADMINISTRATOR : Role.PLAYER;

    //Get token to reply request
    const token = generateToken({
      id: user.id,
      role,
      username: user.username,
    });

    //Delete unnecessary information.
    delete userData.password;
    delete userData.idLeftAssociation;
    delete userData.idRightAssociation;
    delete userData.idCaptain;
    delete userData.createAt;
    delete userData.updateAt;
    delete userData.idRole;
    delete userData.triplicationOfId;

    //Pack and reply the request according whit the interface.
    const response: LoginResponse = {
      token,
      userData,
      role,
    };

    return res.send(response);
  } catch (error) {
    handleHttp(res, `Error on loggin process: ${error}.`, 500);
  }
};

const adminLoginController = async (req: Request, res: Response) => {
  try {
    const loginData: LoginRequest = req.body;

    const response = await adminLoginService(
      loginData.username,
      loginData.password
    );

    return res.status(response.status).send({ token: response.message });
  } catch (error) {
    handleHttp(res, `Error on login process: ${error}`, 500);
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const result = await loginService(email, password);
    if ('status' in result && typeof result.status === 'number') {
        return res.status(result.status).json({ message: result.message });
    }
    return res.status(200).json(result);
  } catch (error: any) {
    handleHttp(res, 'ERROR_LOGIN_CONTROLLER', error.message);
  }
};

export const getSecurityQuestionController = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }
    // Call the new service
    const result = await getSecurityQuestionService(username); 
    // The service will return an object like { status: number, message?: string, securityQuestion?: string }
    if (result.status !== 200) {
        return res.status(result.status).json({ message: result.message });
    }
    return res.status(result.status).json({ securityQuestion: result.securityQuestion });
  } catch (error: any) {
    handleHttp(res, 'ERROR_GET_SECURITY_QUESTION_CONTROLLER', error.message);
  }
};

export const verifySecurityAnswerController = async (req: Request, res: Response) => {
  try {
    const { username, securityAnswer } = req.body;
    if (!username || !securityAnswer) {
      return res.status(400).json({ message: 'Username and security answer are required' });
    }
    // Call the new service
    const result = await verifySecurityAnswerService(username, securityAnswer);
    // The service will return an object like { status: number, message?: string, token?: string }
    if (result.status !== 200) {
        return res.status(result.status).json({ message: result.message });
    }
    return res.status(result.status).json({ token: result.token });
  } catch (error: any) {
    handleHttp(res, 'ERROR_VERIFY_SECURITY_ANSWER_CONTROLLER', error.message);
  }
};

export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body; // Changed 'password' to 'newPassword' to match frontend

    if (!token) { 
      return res.status(400).json({ message: 'Reset token is required in the request body' });
    }
    // Validating 'newPassword' which is now correctly destructured
    if (!newPassword) { 
      return res.status(400).json({ message: 'New password is required in the request body' });
    }

    // Passing 'newPassword' to the service
    const result = await resetPasswordService(token, newPassword); 
    return res.status(result.status).json({ message: result.message });
  } catch (error: any) {
    handleHttp(res, 'ERROR_RESET_PASSWORD_CONTROLLER', error.message);
  }
};

export const changePasswordController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) { // Check for user and user.id
        return res.status(401).json({ message: 'Unauthorized: User not authenticated or ID missing' });
    }
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const result = await changePasswordService(userId, oldPassword, newPassword);
    return res.status(result.status).json({ message: result.message });
  } catch (error: any) {
    handleHttp(res, 'ERROR_CHANGE_PASSWORD_CONTROLLER', error.message);
  }
};

export { adminLoginController, loginCtrl };


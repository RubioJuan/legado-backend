import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/db';
import { EntityUser } from '../entities/user.entity';
import { ServiceResponse } from '../interfaces/admin.request.interface'; // Assuming this interface exists
import { Role } from '../types/enums.types';
import { encrypt, verified } from '../utils/bcrypt.handle'; // For hashing security answer
import { findUserByEmail, findUserByResetToken, readUserByUsername as findUserByUsername } from './user.service'; // Assuming these functions exist or will be created

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // Use environment variable
const JWT_EXPIRES_IN = '1h';
const RESET_TOKEN_EXPIRES_IN_MS = 3600000; // 1 hour in milliseconds
const SECURITY_ANSWER_RESET_TOKEN_EXPIRES_IN_MS = 900000; // 15 minutes
const SECURITY_LOCKOUT_DURATION_MS = 300000; // 5 minutes
const MAX_FAILED_SECURITY_ATTEMPTS = 3;

export const loginService = async (email: string, passwordInput: string): Promise<{ token: string; userData: any } | ServiceResponse> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    console.log(`[AuthService - login] Attempting login for email (username): ${email}`); // LOG 1
    const user = await findUserByEmail(queryRunner, email);

    if (!user) {
      console.log(`[AuthService - login] User not found for email (username): ${email}`); // LOG 2
      return { message: 'Invalid credentials', status: 401 };
    }
    console.log(`[AuthService - login] User found: ${user.username}, ID: ${user.id}`); // LOG 3

    const isPasswordValid = await bcrypt.compare(passwordInput, user.password);
    if (!isPasswordValid) {
      console.log(`[AuthService - login] Invalid password for user: ${user.username}`); // LOG 4
      return { message: 'Invalid credentials', status: 401 };
    }

    console.log(`[AuthService - login] Login successful for user: ${user.username}`); // LOG 5

    const tokenPayloadForJwt = { id: user.id, username: user.username, role: user.idRole === 1 ? Role.ADMINISTRATOR : Role.PLAYER };
    const token = jwt.sign(tokenPayloadForJwt, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    
    const userDataForFrontend = {
      idUser: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      country: user.country,
      countryCode: user.countryCode,
      phoneNumber: user.phoneNumber,
      role: user.idRole === 1 ? Role.ADMINISTRATOR : Role.PLAYER,
      ballsSended: user.ballsSended,
      ballsReceived: user.ballsReceived,
      ballsReceivedConfirmed: user.ballsReceivedConfirmed,
      beneficiatedNames: user.beneficiatedNames,
      beneficiatedPhoneNumber: user.beneficiatedPhoneNumber,
      beneficiatedCountry: user.beneficiatedCountry,
      beneficiatedCountryCode: user.beneficiatedCountryCode,
      acceptMarketing: user.acceptMarketing,
      triplicationDone: user.triplicationDone,
      idUserProcessState: user.idUserProcessState,
      createAt: user.createAt,
      updateAt: user.updateAt,
      idUserState: user.idUserState,
      idLeftAssociation: user.idLeftAssociation,
      idRightAssociation: user.idRightAssociation,
      idCaptain: user.idCaptain,
      triplicationOfId: user.triplicationOfId,
    };

    return { token, userData: userDataForFrontend };
  } catch (error: any) {
    console.error('[AuthService - login] Error:', error);
    return { message: error.message || 'Login failed', status: 500 };
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const getSecurityQuestionService = async (username: string): Promise<ServiceResponse & { securityQuestion?: string }> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    const user = await findUserByUsername(queryRunner, username);
    if (!user) {
      return { message: 'Usuario no encontrado.', status: 404 };
    }
    if (!user.securityQuestion) {
      return { message: 'El usuario no ha configurado una pregunta de seguridad.', status: 400 };
    }
    return { message: 'Pregunta de seguridad obtenida.', status: 200, securityQuestion: user.securityQuestion };
  } catch (error: any) {
    console.error('[AuthService - getSecurityQuestion] Error:', error);
    return { message: error.message || 'Error al obtener la pregunta de seguridad.', status: 500 };
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const verifySecurityAnswerService = async (username: string, securityAnswer: string): Promise<ServiceResponse & { token?: string }> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const user = await findUserByUsername(queryRunner, username);
    if (!user) {
      await queryRunner.rollbackTransaction();
      return { message: 'Usuario no encontrado.', status: 404 };
    }

    if (user.securityLockoutUntil && user.securityLockoutUntil > new Date()) {
      await queryRunner.rollbackTransaction();
      const timeLeft = Math.ceil((user.securityLockoutUntil.getTime() - Date.now()) / 60000);
      return { message: `Cuenta bloqueada temporalmente. Intente de nuevo en ${timeLeft} minutos.`, status: 403 };
    }

    if (!user.securityAnswerHash) {
      await queryRunner.rollbackTransaction();
      return { message: 'El usuario no ha configurado una respuesta de seguridad.', status: 400 };
    }

    const isAnswerCorrect = await verified(securityAnswer, user.securityAnswerHash);

    if (!isAnswerCorrect) {
      user.failedSecurityAttempts = (user.failedSecurityAttempts || 0) + 1;
      let lockoutUntil: Date | null = user.securityLockoutUntil ?? null;
      if (user.failedSecurityAttempts >= MAX_FAILED_SECURITY_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + SECURITY_LOCKOUT_DURATION_MS);
        user.failedSecurityAttempts = 0; // Reset after locking
      }
      // Update only relevant fields
      await queryRunner.manager.update(EntityUser, user.id, {
        failedSecurityAttempts: user.failedSecurityAttempts,
        securityLockoutUntil: lockoutUntil
      });
      await queryRunner.commitTransaction();
      return { message: 'Respuesta incorrecta.', status: 400 };
    }

    // If answer is correct, reset attempts and lockout, and set reset token fields
    const newPasswordResetToken = crypto.randomBytes(32).toString('hex');
    const hashedNewResetToken = crypto.createHash('sha256').update(newPasswordResetToken).digest('hex');
    const newPasswordResetExpires = new Date(Date.now() + SECURITY_ANSWER_RESET_TOKEN_EXPIRES_IN_MS);
    
    await queryRunner.manager.update(EntityUser, user.id, {
      failedSecurityAttempts: 0,
      securityLockoutUntil: null,
      passwordResetToken: hashedNewResetToken,
      passwordResetExpires: newPasswordResetExpires
    });
    
    await queryRunner.commitTransaction();

    return { message: 'Respuesta verificada. Token de reseteo generado.', status: 200, token: newPasswordResetToken }; // Return the non-hashed token
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('[AuthService - verifySecurityAnswer] Error:', error);
    return { message: error.message || 'Error al verificar la respuesta de seguridad.', status: 500 };
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const resetPasswordService = async (token: string, newPasswordInput: string): Promise<ServiceResponse> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await findUserByResetToken(queryRunner, hashedToken);

    if (!user) {
      await queryRunner.rollbackTransaction();
      return { message: 'El token de reseteo es inválido o ha expirado.', status: 400 };
    }
     if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await queryRunner.manager.save(EntityUser, user);
      await queryRunner.commitTransaction();
      return { message: 'El token de reseteo ha expirado.', status: 400 };
    }

    const hashedPassword = await encrypt(newPasswordInput);
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await queryRunner.manager.save(EntityUser, user);
    await queryRunner.commitTransaction();

    return { message: 'La contraseña ha sido reseteada exitosamente.', status: 200 };
  } catch (error: any) {
    await queryRunner.rollbackTransaction();
    console.error('[AuthService - resetPassword] Error:', error);
    return { message: error.message || 'Error al resetear la contraseña.', status: 500 };
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
};

export const changePasswordService = async (userId: number, oldPasswordInput: string, newPasswordInput: string): Promise<ServiceResponse> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const user = await queryRunner.manager.findOne(EntityUser, { where: { id: userId } });
    
    if (!user) {
      await queryRunner.rollbackTransaction();
      return { message: 'Usuario no encontrado', status: 404 };
    }

    console.log(`[changePasswordService] Attempting password change for user: ${user.username}`);

    // Use our verified utility instead of bcrypt.compare directly
    const isOldPasswordValid = await verified(oldPasswordInput, user.password);
    if (!isOldPasswordValid) {
      await queryRunner.rollbackTransaction();
      console.log(`[changePasswordService] Invalid old password for user: ${user.username}`);
      return { message: 'Contraseña actual incorrecta', status: 400 };
    }

    // Use our encrypt utility instead of bcrypt.hash directly
    const hashedNewPassword = await encrypt(newPasswordInput);
    console.log(`[changePasswordService] Password hashed successfully for user: ${user.username}`);

    // Update the password
    await queryRunner.manager.update(EntityUser, { id: userId }, { password: hashedNewPassword });
    
    await queryRunner.commitTransaction();
    console.log(`[changePasswordService] Password changed successfully for user: ${user.username}`);

    return { message: 'Contraseña cambiada exitosamente', status: 200 };
  } catch (error: any) {
    console.error('[changePasswordService] Error:', error);
    if (queryRunner.isTransactionActive) {
    await queryRunner.rollbackTransaction();
    }
    return { message: error.message || 'Error al cambiar contraseña', status: 500 };
  } finally {
    if (!queryRunner.isReleased) {
      await queryRunner.release();
    }
  }
}; 
import { Router } from "express";

//Controllers
import {
    changePasswordController,
    getSecurityQuestionController,
    loginController,
    resetPasswordController,
    verifySecurityAnswerController
} from "../controllers/auth.controller";
import { getSubscriptions } from "../controllers/subscription.controller";
import { createUser } from "../controllers/user.controller";

//Middlewares
import { jwtAuthMiddleware } from '../middlewares/jwt.middleware';
import { validatorUsername } from "../middlewares/validatorUsername";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and password management
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in, returns JWT and user data
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
router.post("/register", validatorUsername, createUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in, returns JWT and user data
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginController);

/**
 * @swagger
 * /auth/get-security-question:
 *   post:
 *     summary: Get security question for a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Security question retrieved successfully
 *       400:
 *         description: Username is required
 *       404:
 *         description: User not found or no security question set
 */
router.post('/get-security-question', getSecurityQuestionController);

/**
 * @swagger
 * /auth/verify-security-answer:
 *   post:
 *     summary: Verify security answer and get a reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - securityAnswer
 *             properties:
 *               username:
 *                 type: string
 *               securityAnswer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Answer verified, returns reset token
 *       400:
 *         description: Invalid input or incorrect answer
 *       401:
 *         description: Too many failed attempts, account locked
 *       404:
 *         description: User not found
 */
router.post('/verify-security-answer', verifySecurityAnswerController);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password has been reset successfully
 *       400:
 *         description: Invalid token or missing new password
 */
router.post('/reset-password', resetPasswordController);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password for an authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid input or incorrect old password
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', jwtAuthMiddleware, changePasswordController);

/**
 * @swagger
 * /auth/users/me/subscriptions:
 *   get:
 *     summary: Get subscriptions for the authenticated user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserSubscriptionInfo'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found or no subscriptions
 *       500:
 *         description: Internal server error
 */
router.get("/users/me/subscriptions", jwtAuthMiddleware, getSubscriptions);

export { router as authRoutes };


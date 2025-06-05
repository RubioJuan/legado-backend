import { Router } from "express";
import {
    checkGenesisFourthBlockadeController,
    checkGenesisThirdBlockadeController,
    createChildUserForGenesisBlockade,
    getChildUsersForBoard,
    getUserBlockedBoardController,
    getUserProfileController,
    requestUnlockBySecondaryGeneral,
    updateUserProfileController
} from "../controllers/user.controller";
import { checkJwt } from "../middlewares/checkSession"; // Assuming this is the correct JWT middleware

export const userRoutes = Router();

/**
 * @swagger
 * /users/unlock-board/{recruitBoardId}/{targetRecruitUserId}:
 *   post:
 *     summary: Unlock a recruit's board by secondary general action.
 *     tags: [Users, Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recruitBoardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the recruit's secondary board (where the acting general is the leader).
 *       - in: path
 *         name: targetRecruitUserId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the target recruit user whose primary board is to be unblocked.
 *     responses:
 *       200:
 *         description: Board unblocked successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request (e.g., missing parameters, invalid action).
 *       401:
 *         description: Unauthorized (user not authenticated).
 *       403:
 *         description: Forbidden (user is not the general of the recruit's board).
 *       404:
 *         description: Not found (e.g., recruit board or target user not found).
 *       500:
 *         description: Internal server error.
 */
userRoutes.post(
  "/unlock-board/:recruitBoardId/:targetRecruitUserId",
  checkJwt,
  requestUnlockBySecondaryGeneral
); 

/**
 * @swagger
 * /users/check-genesis-third-blockade:
 *   get:
 *     summary: Check if a Genesis board in stage 3 can be unblocked based on verified children users.
 *     tags: [Users, Boards, Blockades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stage 3 blockade check status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (user not authenticated).
 *       500:
 *         description: Internal server error.
 */
userRoutes.get(
  "/check-genesis-third-blockade",
  checkJwt,
  checkGenesisThirdBlockadeController
);

/**
 * @swagger
 * /users/check-genesis-fourth-blockade:
 *   get:
 *     summary: Check if a Genesis board in stage 4 can be unblocked after the third child was verified.
 *     tags: [Users, Boards, Blockades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stage 4 blockade check status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (user not authenticated).
 *       500:
 *         description: Internal server error.
 */
userRoutes.get(
  "/check-genesis-fourth-blockade",
  checkJwt,
  checkGenesisFourthBlockadeController
);

/**
 * @swagger
 * /users/create-child-user:
 *   post:
 *     summary: Create a new child user for Genesis stage 3 blockade.
 *     tags: [Users, Blockades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *               - firstName
 *               - lastName
 *               - country
 *               - countryCode
 *               - phoneNumber
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               country:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               securityQuestion:
 *                 type: string
 *               securityAnswer:
 *                 type: string
 *               paymentMethods:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     value:
 *                       type: string
 *     responses:
 *       201:
 *         description: Child user created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userData:
 *                   type: object
 *                   properties:
 *                     idUser:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     remainingChildren:
 *                       type: integer
 *       400:
 *         description: Bad request (e.g., missing required fields, max children already created).
 *       401:
 *         description: Unauthorized (user not authenticated).
 *       404:
 *         description: Not found (e.g., user doesn't have a Genesis board in stage 3).
 *       500:
 *         description: Internal server error.
 */
userRoutes.post(
  "/create-child-user",
  checkJwt,
  createChildUserForGenesisBlockade
);

/**
 * @swagger
 * /users/{userId}/blocked-board:
 *   get:
 *     summary: Check if a user has a blocked board and return its details
 *     tags: [Users, Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to check for blocked boards
 *     responses:
 *       200:
 *         description: Information about the user's blocked board (if any)
 *       404:
 *         description: User has no blocked board
 */
userRoutes.get(
  "/:userId/blocked-board",
  getUserBlockedBoardController
);

/**
 * @swagger
 * /users/child-users/{boardId}:
 *   get:
 *     summary: Get all child users created for a specific board's general
 *     tags: [Users, Boards]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the board to get child users for
 *     responses:
 *       200:
 *         description: List of child users with their verification status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 childUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       idUserProcessState:
 *                         type: integer
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                 totalCount:
 *                   type: integer
 *                 verifiedCount:
 *                   type: integer
 *       400:
 *         description: Invalid board ID
 *       404:
 *         description: Board not found or has no general
 *       500:
 *         description: Internal server error
 */
userRoutes.get("/child-users/:boardId", getChildUsersForBoard); 

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get user profile information
 *     description: Returns user profile data. For security reasons, password and securityAnswer are NOT included in the response.
 *     tags: [Users, Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                   example: "Juan"
 *                 lastName:
 *                   type: string
 *                   example: "Pérez"
 *                 username:
 *                   type: string
 *                   example: "prueba9"
 *                 email:
 *                   type: string
 *                   example: "prueba9"
 *                   description: "Same as username"
 *                 phoneNumber:
 *                   type: string
 *                   example: "+57 123 456 7890"
 *                 securityQuestion:
 *                   type: string
 *                   nullable: true
 *                   example: "pet_name"
 *                   description: "Only the question is returned, NOT the answer for security"
 *                 paymentMethods:
 *                   type: array
 *                   nullable: true
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: "nequi"
 *                       value:
 *                         type: string
 *                         example: "3001234567"
 *                       accountType:
 *                         type: string
 *                         example: "ahorros"
 *               note: "Password and securityAnswer are NOT returned for security reasons"
 *       401:
 *         description: Unauthorized (user not authenticated)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoutes.get("/profile", checkJwt, getUserProfileController);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile information
 *     description: Updates user profile. Payment methods are completely replaced with new array. Note - Password updates should use the separate change-password endpoint for security.
 *     tags: [Users, Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Juan"
 *               lastName:
 *                 type: string
 *                 example: "Pérez"
 *               username:
 *                 type: string
 *                 example: "prueba9"
 *                 description: "Must be unique"
 *               email:
 *                 type: string
 *                 example: "prueba9"
 *                 description: "Same as username"
 *               phoneNumber:
 *                 type: string
 *                 example: "+57 123 456 7890"
 *               securityQuestion:
 *                 type: string
 *                 example: "pet_name"
 *               securityAnswer:
 *                 type: string
 *                 example: "Firulais"
 *                 description: "Will be encrypted before storage"
 *               paymentMethods:
 *                 type: array
 *                 description: "Replaces ALL existing payment methods. To edit one method, send all methods including the edited one."
 *                 example: [
 *                   {
 *                     "type": "nequi",
 *                     "value": "3009876543"
 *                   },
 *                   {
 *                     "type": "bancolombia",
 *                     "value": "9876543210",
 *                     "accountType": "corriente"
 *                   }
 *                 ]
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: ["nequi", "bancolombia", "daviplata"]
 *                       example: "nequi"
 *                       description: "nequi: phone number, bancolombia: account number + accountType, daviplata: phone number"
 *                     value:
 *                       type: string
 *                       example: "3001234567"
 *                       description: "Phone number for nequi/daviplata (10 digits starting with 3), account number for bancolombia (8-12 digits)"
 *                     accountType:
 *                       type: string
 *                       enum: ["ahorros", "corriente"]
 *                       example: "ahorros"
 *                       description: "Required only for bancolombia"
 *             note: "All fields are optional. Use /auth/change-password for password updates. Payment methods array replaces existing methods."
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Perfil actualizado exitosamente"
 *       400:
 *         description: Bad request (e.g., username already exists, invalid payment method format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error en métodos de pago: Nequi debe ser un número de teléfono válido (ej: 3001234567)"
 *       401:
 *         description: Unauthorized (user not authenticated)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
userRoutes.put("/profile", checkJwt, updateUserProfileController); 
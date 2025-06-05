import { Router } from "express";

//Middlewares
import { checkJwt, checkJwtAdmin } from "../middlewares/checkSession";

//Controllers
import {
  adminDeleteUserController,
  changePasswordByUsernameController,
  deleteUserByUsernameController,
} from "../controllers/user.controller";
import {
  assignPlayerController,
  massiveAssignPlayersController,
  massiveUpdatePlayersController,
} from "../controllers/board.controller";
import { adminLoginController } from "../controllers/auth.controller";

//Routes
export const adminRoutes = Router();

adminRoutes.post("/login", adminLoginController);

adminRoutes.delete("/users/:id", checkJwtAdmin, adminDeleteUserController);

adminRoutes.delete("/users", checkJwtAdmin, deleteUserByUsernameController);

adminRoutes.post(
  "/users/change-password",
  checkJwtAdmin,
  changePasswordByUsernameController
);

adminRoutes.post(
  "/stadiums/assign-player",
  checkJwtAdmin,
  assignPlayerController
);

adminRoutes.post(
  "/stadiums/massive-assign-players",
  checkJwtAdmin,
  massiveAssignPlayersController
);

adminRoutes.post(
  "/users/massive-update-players",
  checkJwtAdmin,
  massiveUpdatePlayersController
);

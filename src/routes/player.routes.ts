import { Router } from "express";

//Middlewares
// import { checkJwt } from "../middlewares/checkSession"; // Comentado o eliminado
import { jwtAuthMiddleware } from "../middlewares/jwt.middleware"; // Importar el middleware correcto

//Controllers
import { getSubscriptionsController, triplicationController } from "../controllers/player.controller";
import { deleteUserController } from "../controllers/user.controller";

//Routes
export const playerRoutes = Router();

playerRoutes.delete("/player", jwtAuthMiddleware, deleteUserController);

playerRoutes.post("/player/triplication", jwtAuthMiddleware, triplicationController);

playerRoutes.get("/player/subscriptions", jwtAuthMiddleware, getSubscriptionsController);


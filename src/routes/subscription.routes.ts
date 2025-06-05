import { Router } from "express";
import { getSubscriptions } from "../controllers/subscription.controller";
// import { checkJwt } from "../middlewares/checkSession"; // Comentado o eliminado
import { jwtAuthMiddleware } from "../middlewares/jwt.middleware"; // Importar el middleware correcto

const router = Router();

router.get("/subscriptions", jwtAuthMiddleware, getSubscriptions); // Usar jwtAuthMiddleware

export default router;

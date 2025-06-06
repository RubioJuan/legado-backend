import cors from "cors";
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";

// Cargar variables de entorno (.env)
dotenv.config();

// Routes
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { boardRoutes } from "./routes/board.routes";
import { playerRoutes } from "./routes/player.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import { userRoutes } from "./routes/user.routes";

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://127.0.0.1:5501', 'http://localhost:5501'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(morgan("dev"));
app.use(express.json());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Ruta base
app.get('/', (req, res) => {
  res.send('API funcionando correctamente 🚀');
});

// Ruta de salud para Render
app.get('/healthz', (_req, res) => {
  res.sendStatus(200);
});

// Rutas API
app.use("/api", subscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", boardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", playerRoutes);
app.use("/api/users", userRoutes);

export default app;

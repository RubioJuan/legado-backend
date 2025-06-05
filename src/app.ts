import cors from "cors";
import express from "express";
import morgan from "morgan";

//Routes
// import authRoutes from "./routes/auth.routes";
import { adminRoutes } from "./routes/admin.routes";
import { authRoutes } from "./routes/auth.routes";
import { boardRoutes } from "./routes/board.routes";
import { playerRoutes } from "./routes/player.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import { userRoutes } from "./routes/user.routes";
// import accountRoutes from "./routes/account.routes";

const app = express();

// CORS Configuration
const corsOptions = {
  origin: ['http://127.0.0.1:5501', 'http://localhost:5501'], // Frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow credentials
};

app.use(morgan("dev"));
app.use(express.json());

app.use(cors(corsOptions)); // Use configured CORS

// Handle pre-flight requests for all routes
app.options('*', cors(corsOptions));

//Routes
// app.use("/api/auth", authRoutes);

// app.use("/api", userRoutes);
app.use("/api", subscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", boardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", playerRoutes);
app.use("/api/users", userRoutes);

// app.use("/api", accountRoutes);

export default app;

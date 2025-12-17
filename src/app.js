import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import sayurRoutes from "./routes/sayur.routes.js";
import pesananRoutes from "./routes/pesanan.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sayur", sayurRoutes);
app.use("/api/pesanan", pesananRoutes);

export default app;

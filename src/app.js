import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import sayurRoutes from "./routes/sayur.routes.js";
import pesananRoutes from "./routes/pesanan.routes.js";
import pengirimanRoutes from "./routes/pengiriman.routes.js";
import addressRoutes from "./routes/address.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/sayur", sayurRoutes);
app.use("/api/pesanan", pesananRoutes);
app.use("/api/pengiriman", pengirimanRoutes);
app.use("/api/addresses", addressRoutes);
console.log("API KEY:", process.env.KOMERCE_API_KEY);
export default app;

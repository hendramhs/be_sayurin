import express from "express";
import { createPesanan } from "../controllers/pesanan.controller.js";

const router = express.Router();

router.post("/", createPesanan);

export default router;

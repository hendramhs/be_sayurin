import express from "express";
import { hitungOngkir } from "../controllers/ongkir.controller.js";

const router = express.Router();

router.post("/", hitungOngkir);

export default router;

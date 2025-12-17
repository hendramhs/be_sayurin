import express from "express";
import {
  createPesanan,
  getPesananAdmin,
  getDetailPesanan,
  updateStatusPesanan
} from "../controllers/pesanan.controller.js";

const router = express.Router();

router.post("/", createPesanan);
router.get("/admin", getPesananAdmin);
router.get("/:id", getDetailPesanan);
router.put("/:id/status", updateStatusPesanan);

export default router;

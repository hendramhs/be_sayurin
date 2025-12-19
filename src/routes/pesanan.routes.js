import express from "express";
import {
  createPesanan,
  getPesananAdmin,
  getPesananUser,
  getDetailPesanan,
  updateStatusPesanan
} from "../controllers/pesanan.controller.js";

const router = express.Router();

router.post("/", createPesanan);
router.get("/admin", getPesananAdmin);
router.get("/user/:user_id", getPesananUser);
router.get("/:id", getDetailPesanan);
router.put("/:id/status", updateStatusPesanan);

export default router;

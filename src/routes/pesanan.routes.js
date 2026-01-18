import express from "express";
import {
  createPesanan,
  getPesananAdmin,
  getPesananUser,
  getDetailPesanan,
  updateStatusPesanan,
  getDashboardStats,
} from "../controllers/pesanan.controller.js";

const router = express.Router();

router.post("/", createPesanan);
router.get("/admin", getPesananAdmin);
router.get("/user/:user_id", getPesananUser);
router.get("/:id", getDetailPesanan);
router.put("/:id/status", updateStatusPesanan);
router.get("/admin/dashboard-stats", getDashboardStats);

export default router;

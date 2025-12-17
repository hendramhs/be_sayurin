import express from "express";
import {
  getSayur,
  addSayur,
  updateSayur,
  deleteSayur
} from "../controllers/sayur.controller.js";

const router = express.Router();

router.get("/", getSayur);
router.post("/", addSayur);
router.put("/:id", updateSayur);
router.delete("/:id", deleteSayur);

export default router;

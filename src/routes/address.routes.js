import express from "express";
import {
  addAddress,
  getAddressesByUser,
  getDefaultAddress,
  setDefaultAddress,
  deleteAddress
} from "../controllers/address.controller.js";

const router = express.Router();

router.post("/add", addAddress);
router.get("/user/:user_id", getAddressesByUser);
router.get("/default/:user_id", getDefaultAddress);
router.put("/set-default", setDefaultAddress);
router.delete("/:address_id", deleteAddress);

export default router;

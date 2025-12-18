import express from "express";
import { addToCart, getCart, deleteCartItem, updateCartQuantity } from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/", addToCart);
router.get("/user/:user_id", getCart);
router.put("/:cart_id", updateCartQuantity);
router.delete("/:cart_id", deleteCartItem);

export default router;

import express from "express";
import {
  hitungOngkir,
  hitungOngkirV2,
  pilihPengiriman
} from "../controllers/pengiriman.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Hitung ongkir (ambil opsi kurir)
|--------------------------------------------------------------------------
*/
router.post("/hitung", hitungOngkir);
router.post("/hitung-v2", hitungOngkirV2);

/*
|--------------------------------------------------------------------------
| Simpan pilihan pengiriman
|--------------------------------------------------------------------------
*/
router.post("/pilih", pilihPengiriman);

export default router;

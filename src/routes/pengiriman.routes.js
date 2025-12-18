import express from "express";
import {
  hitungOngkir,
  pilihPengiriman
} from "../controllers/pengiriman.controller.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Hitung ongkir (ambil opsi kurir)
|--------------------------------------------------------------------------
*/
router.post("/hitung", hitungOngkir);

/*
|--------------------------------------------------------------------------
| Simpan pilihan pengiriman
|--------------------------------------------------------------------------
*/
router.post("/pilih", pilihPengiriman);

export default router;

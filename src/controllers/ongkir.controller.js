import axios from "axios";
import { db } from "../config/db.js";

export const hitungOngkir = async (req, res) => {
  try {
    const {
      pesanan_id,
      shipper_destination_id,
      receiver_destination_id,
      weight
    } = req.body;

    // 1️⃣ VALIDASI
    if (!pesanan_id || !shipper_destination_id || !receiver_destination_id || !weight) {
      return res.status(400).json({
        success: false,
        message: "Parameter tidak lengkap"
      });
    }

    // 2️⃣ AMBIL TOTAL BARANG
    const [pesananRows] = await db.query(
      "SELECT total_barang FROM pesanan WHERE pesanan_id = ?",
      [pesanan_id]
    );

    if (pesananRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan"
      });
    }

    const itemValue = Number(pesananRows[0].total_barang);

    // 3️⃣ REQUEST KE KOMERCE
    const komerceRes = await axios.get(
      "https://api-sandbox.collaborator.komerce.id/tariff/api/v1/calculate",
      {
        headers: {
          "x-api-key": process.env.KOMERCE_API_KEY
        },
        params: {
          shipper_destination_id,
          receiver_destination_id,
          weight,
          item_value: itemValue,
          cod: "yes"
        }
      }
    );

    const data = komerceRes.data?.data;

    // 4️⃣ GABUNG SEMUA SERVICE
    const services = [
      ...(data.calculate_reguler || []),
      ...(data.calculate_regular || []),
      ...(data.calculate_cargo || []),
      ...(data.calculate_instant || [])
    ].filter(s => typeof s.shipping_cost_net === "number");

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ongkir tidak tersedia"
      });
    }

    // 5️⃣ PILIH ONGKIR TERMURAH
    const ongkirRaw = Math.min(
      ...services.map(s => s.shipping_cost_net)
    );

    const ongkir = Math.floor(ongkirRaw / 100);


    const totalBayar = itemValue + ongkir;

    // 6️⃣ UPDATE PESANAN
    await db.query(
      "UPDATE pesanan SET ongkir = ?, total_bayar = ? WHERE pesanan_id = ?",
      [ongkir, totalBayar, pesanan_id]
    );

    return res.json({
      success: true,
      ongkir,
      total_barang: itemValue,
      total_bayar: totalBayar,
      layanan: services
    });

  } catch (error) {
    console.error("ONGKIR ERROR:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Gagal menghitung ongkir"
    });
  }
};

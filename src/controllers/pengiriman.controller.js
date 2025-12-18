import axios from "axios";
import { db } from "../config/db.js";

/**
 * HITUNG ONGKIR (LIST LAYANAN)
 */
export const hitungOngkir = async (req, res) => {
  try {
    const {
      pesanan_id,
      shipper_destination_id,
      receiver_destination_id,
      weight
    } = req.body;

    if (!pesanan_id || !shipper_destination_id || !receiver_destination_id || !weight) {
      return res.status(400).json({
        success: false,
        message: "Parameter tidak lengkap"
      });
    }

    // ambil total barang
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

    const itemValue = pesananRows[0].total_barang;

    // request ke Komerce
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

    const services = [
      ...(data.calculate_reguler || []),
      ...(data.calculate_regular || []),
      ...(data.calculate_cargo || []),
      ...(data.calculate_instant || [])
    ];

    if (services.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ongkir tidak tersedia"
      });
    }

    res.json({
      success: true,
      layanan: services
    });

  } catch (error) {
    console.error("HITUNG ONGKIR ERROR:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Gagal menghitung ongkir"
    });
  }
};

/**
 * PILIH PENGIRIMAN (SIMPAN ONGKIR)
 */
export const pilihPengiriman = async (req, res) => {
  try {
    const {
      pesanan_id,
      shipping_name,
      service_name,
      shipping_cost,
      service_fee = 0,
      is_cod = 0,
      etd,
      shipper_destination_id,
      receiver_destination_id,
      berat
    } = req.body;


    if (
      !pesanan_id || !shipping_name || !service_name ||
      !shipping_cost || !shipper_destination_id ||
      !receiver_destination_id || !berat
    ) {
      return res.status(400).json({
        success: false,
        message: "Data pengiriman tidak lengkap"
      });
    }

    // ambil pesanan
    const [pesananRows] = await db.query(
      "SELECT total_barang, address_id FROM pesanan WHERE pesanan_id = ?",
      [pesanan_id]
    );

    if (pesananRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan"
      });
    }

    const totalBarang = pesananRows[0].total_barang;
    const totalBayar = totalBarang + shipping_cost;

    // ambil kota asal (vendor)
    const [vendorRows] = await db.query(
      "SELECT city FROM vendor LIMIT 1"
    );

    // ambil kota tujuan (alamat user)
    const [alamatRows] = await db.query(
      `SELECT city FROM user_addresses
       WHERE address_id = ?`,
      [pesananRows[0].address_id]
    );

    if (vendorRows.length === 0 || alamatRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Data alamat tidak lengkap"
      });
    }

    const kotaAsal = vendorRows[0].city;
    const kotaTujuan = alamatRows[0].city;

    // simpan pengiriman
    await db.query(
    `INSERT INTO pengiriman
    (pesanan_id, shipping_name, service_name, is_cod, etd,
      shipper_destination_id, receiver_destination_id,
      kota_asal, kota_tujuan,
      berat, shipping_cost, service_fee)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      pesanan_id,
      shipping_name,
      service_name,
      is_cod,
      etd,
      shipper_destination_id,
      receiver_destination_id,
      kotaAsal,
      kotaTujuan,
      berat,
      shipping_cost,
      service_fee
    ]
  );

    // update pesanan
    await db.query(
      "UPDATE pesanan SET ongkir = ?, total_bayar = ? WHERE pesanan_id = ?",
      [shipping_cost, totalBayar, pesanan_id]
    );

    res.json({
      success: true,
      message: "Pengiriman berhasil disimpan",
      ongkir: shipping_cost,
      total_bayar: totalBayar
    });

  } catch (error) {
    console.error("PILIH PENGIRIMAN ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

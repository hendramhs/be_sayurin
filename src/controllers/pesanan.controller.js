import { db } from "../config/db.js";

export const createPesanan = async (req, res) => {
  const { user_id, items } = req.body;

  if (!user_id || !items || items.length === 0) {
    return res.json({
      success: false,
      message: "Data pesanan tidak lengkap"
    });
  }

  try {
    let totalBarang = 0;

    // 1️⃣ Ambil harga sayur & hitung subtotal
    const detailItems = [];

    for (const item of items) {
      const [rows] = await db.query(
        "SELECT harga FROM sayur WHERE sayur_id = ?",
        [item.sayur_id]
      );

      if (rows.length === 0) {
        return res.json({
          success: false,
          message: "Sayur tidak ditemukan"
        });
      }

      const harga = rows[0].harga;
      const subtotal = harga * item.jumlah;

      totalBarang += subtotal;

      detailItems.push({
        sayur_id: item.sayur_id,
        jumlah: item.jumlah,
        harga_satuan: harga,
        subtotal
      });
    }

    // 2️⃣ Insert ke tabel pesanan
    const [result] = await db.query(
      `INSERT INTO pesanan
       (user_id, tanggal, total_barang, ongkir, total_bayar, status)
       VALUES (?, CURDATE(), ?, 0, ?, 'Pending')`,
      [user_id, totalBarang, totalBarang]
    );

    const pesananId = result.insertId;

    // 3️⃣ Insert detail pesanan
    for (const item of detailItems) {
      await db.query(
        `INSERT INTO detail_pesanan
         (pesanan_id, sayur_id, jumlah, harga_satuan, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [
          pesananId,
          item.sayur_id,
          item.jumlah,
          item.harga_satuan,
          item.subtotal
        ]
      );
    }

    res.json({
      success: true,
      message: "Pesanan berhasil dibuat",
      pesanan_id: pesananId,
      total_barang: totalBarang
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

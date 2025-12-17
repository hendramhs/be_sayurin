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


export const getPesananAdmin = async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.pesanan_id, u.nama, p.tanggal,
           p.total_barang, p.ongkir,
           p.total_bayar, p.status
    FROM pesanan p
    JOIN users u ON p.user_id = u.user_id
    ORDER BY p.pesanan_id DESC
  `);

  res.json(rows);
};

export const getDetailPesanan = async (req, res) => {
  const { id } = req.params;

  const [items] = await db.query(`
    SELECT s.nama_sayur, d.jumlah,
           d.harga_satuan, d.subtotal
    FROM detail_pesanan d
    JOIN sayur s ON d.sayur_id = s.sayur_id
    WHERE d.pesanan_id = ?
  `, [id]);

  res.json(items);
};

export const updateStatusPesanan = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.json({
      success: false,
      message: "Status tidak valid"
    });
  }

  await db.query(
    "UPDATE pesanan SET status = ? WHERE pesanan_id = ?",
    [status, id]
  );

  res.json({
    success: true,
    message: `Pesanan berhasil ${status}`
  });
};

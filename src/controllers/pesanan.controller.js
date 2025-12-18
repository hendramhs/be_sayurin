import { db } from "../config/db.js";

/*
|--------------------------------------------------------------------------
| CREATE PESANAN (STEP 1 - PILIH BARANG)
|--------------------------------------------------------------------------
| - User memilih sayur
| - Belum hitung ongkir
| - Belum pilih pengiriman
*/
export const createPesanan = async (req, res) => {
  const { user_id, address_id, items } = req.body;

  if (!user_id || !address_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Data pesanan tidak lengkap"
    });
  }

  try {
    let totalBarang = 0;
    let totalBerat = 0;

    const detailItems = [];

    for (const item of items) {
      const [rows] = await db.query(
        "SELECT harga FROM sayur WHERE sayur_id = ?",
        [item.sayur_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sayur tidak ditemukan"
        });
      }

      const harga = rows[0].harga;
      const subtotal = harga * item.jumlah;

      totalBarang += subtotal;
      totalBerat += item.jumlah * 1000; // 1 kg = 1000 gram

      detailItems.push({
        sayur_id: item.sayur_id,
        jumlah: item.jumlah,
        harga_satuan: harga,
        subtotal
      });
    }

    const [result] = await db.query(
      `INSERT INTO pesanan
       (user_id, address_id, tanggal, total_barang, total_berat, ongkir, total_bayar, status)
       VALUES (?, ?, CURDATE(), ?, ?, 0, ?, 'Pending')`,
      [user_id, address_id, totalBarang, totalBerat, totalBarang]
    );

    const pesananId = result.insertId;

    for (const item of detailItems) {
      await db.query(
        `INSERT INTO detail_pesanan
         (pesanan_id, sayur_id, jumlah, harga_satuan, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [pesananId, item.sayur_id, item.jumlah, item.harga_satuan, item.subtotal]
      );
    }

    res.json({
      success: true,
      message: "Pesanan berhasil dibuat",
      pesanan_id: pesananId,
      total_barang: totalBarang,
      total_berat: totalBerat
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/*
|--------------------------------------------------------------------------
| ADMIN - LIST PESANAN
|--------------------------------------------------------------------------
*/
export const getPesananAdmin = async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.pesanan_id, u.nama, p.tanggal,
           p.total_barang, p.ongkir, p.total_bayar, p.status
    FROM pesanan p
    JOIN users u ON p.user_id = u.user_id
    ORDER BY p.pesanan_id DESC
  `);

  res.json(rows);
};

/*
|--------------------------------------------------------------------------
| DETAIL PESANAN
|--------------------------------------------------------------------------
*/
export const getDetailPesanan = async (req, res) => {
  const { id } = req.params;

  const [items] = await db.query(`
    SELECT s.nama_sayur, d.jumlah, d.harga_satuan, d.subtotal
    FROM detail_pesanan d
    JOIN sayur s ON d.sayur_id = s.sayur_id
    WHERE d.pesanan_id = ?
  `, [id]);

  res.json(items);
};

/*
|--------------------------------------------------------------------------
| ADMIN - APPROVE / REJECT
|--------------------------------------------------------------------------
*/
export const updateStatusPesanan = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({
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
    message: `Pesanan ${status}`
  });
};

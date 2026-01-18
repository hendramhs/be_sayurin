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
    let totalBerat = 0; // disimpan dalam KILOGRAM

    const detailItems = [];

    for (const item of items) {
      const [rows] = await db.query(
        "SELECT harga, satuan FROM sayur WHERE sayur_id = ?",
        [item.sayur_id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Sayur tidak ditemukan"
        });
      }

      const harga = Number(rows[0].harga) || 0;
      const unit = String(rows[0].satuan || "kg").trim().toLowerCase();
      const qty = Number(item.jumlah) || 0;

      const subtotal = harga * qty;
      totalBarang += subtotal;

      // konversi jumlah ke kilogram
      let qtyKg = qty;
      if (unit === "gram" || unit === "g") qtyKg = qty / 1000;
      else if (unit === "ons") qtyKg = qty * 0.1; // 1 ons = 100 gram
      // default selain itu dianggap kg

      totalBerat += qtyKg;

      detailItems.push({
        sayur_id: item.sayur_id,
        jumlah: qty,
        harga_satuan: harga,
        subtotal
      });
    }

    // bulatkan 3 desimal untuk konsistensi
    totalBerat = Number(totalBerat.toFixed(3));

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
      total_berat: totalBerat // kg
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
    SELECT
      p.pesanan_id,
      u.nama,
      p.tanggal,
      p.total_barang,
      p.total_berat AS total_berat_kg,
      p.ongkir,
      p.total_bayar,
      p.status,
      pg.shipping_name,
      pg.service_name,
      pg.etd,
      pg.shipper_destination_id,
      pg.receiver_destination_id,
      pg.kota_asal,
      pg.kota_tujuan,
      pg.shipping_cost,
      pg.service_fee
    FROM pesanan p
    JOIN users u ON p.user_id = u.user_id
    LEFT JOIN pengiriman pg ON pg.pesanan_id = p.pesanan_id
    ORDER BY p.pesanan_id DESC
  `);

  res.json(rows);
};

/*
|--------------------------------------------------------------------------
| USER - LIST PESANAN
|--------------------------------------------------------------------------
*/
export const getPesananUser = async (req, res) => {
  const { user_id } = req.params;
  const [rows] = await db.query(`
    SELECT
      p.pesanan_id,
      p.tanggal,
      p.total_barang,
      p.total_berat AS total_berat_kg,
      p.ongkir,
      p.total_bayar,
      p.status,
      pg.shipping_name,
      pg.service_name,
      pg.etd,
      pg.kota_asal,
      pg.kota_tujuan
    FROM pesanan p
    LEFT JOIN pengiriman pg ON pg.pesanan_id = p.pesanan_id
    WHERE p.user_id = ?
    ORDER BY p.pesanan_id DESC
  `, [user_id]);

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
    SELECT s.nama_sayur, s.satuan, d.jumlah, d.harga_satuan, d.subtotal
    FROM detail_pesanan d
    JOIN sayur s ON d.sayur_id = s.sayur_id
    WHERE d.pesanan_id = ?
  `, [id]);

  res.json(items);
};

/*
|--------------------------------------------------------------------------
| ADMIN - UPDATE STATUS PESANAN
|--------------------------------------------------------------------------
*/
export const updateStatusPesanan = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Approved", "Rejected", "Shipped", "Completed"].includes(status)) {
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

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Ambil Parameter Filter dari Query String
    // Jika tidak ada, gunakan bulan dan tahun saat ini
    const now = new Date();
    const filterMonth = parseInt(req.query.month) || now.getMonth() + 1;
    const filterYear = parseInt(req.query.year) || now.getFullYear();

    // 2. Statistik Kartu (Total Keseluruhan)
    const [stats] = await db.query(`
      SELECT 
        SUM(CASE WHEN status = 'Completed' THEN total_bayar ELSE 0 END) as total_pendapatan,
        COUNT(CASE WHEN status = 'Pending' THEN 1 END) as total_pending,
        COUNT(CASE WHEN status = 'Approved' THEN 1 END) as total_approved,
        COUNT(CASE WHEN status = 'Shipped' THEN 1 END) as total_shipped,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as total_completed,
        COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as total_rejected
      FROM pesanan
    `);

    // 3. Data Grafik Pendapatan Harian (Full 1 Bulan)
    // Menggunakan query rekursif atau tabel bantuan untuk memastikan tanggal kosong tetap muncul dengan nilai 0
    const [revenueDaily] = await db.query(`
      SELECT dates.tanggal, COALESCE(SUM(p.total_bayar), 0) as total
      FROM (
        SELECT DATE(CONCAT(?, '-', ?, '-', n)) as tanggal
        FROM (
          SELECT a.N + b.N * 10 + 1 as n
          FROM (SELECT 0 as N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a
          CROSS JOIN (SELECT 0 as N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3) b
        ) as numbers
        WHERE n <= DAY(LAST_DAY(CONCAT(?, '-', ?, '-01')))
      ) as dates
      LEFT JOIN pesanan p ON DATE(p.tanggal) = dates.tanggal AND p.status = 'Completed'
      GROUP BY dates.tanggal
      ORDER BY dates.tanggal ASC;
    `, [filterYear, filterMonth, filterYear, filterMonth]);

    // 4. Data Grafik Pendapatan Mingguan (Dalam Bulan Terpilih)
    const [revenueWeekly] = await db.query(`
      WITH RECURSIVE weeks AS (
        SELECT 1 AS week_number
        UNION ALL
        SELECT week_number + 1
        FROM weeks
        WHERE week_number < (SELECT CEIL(DAY(LAST_DAY(CONCAT(?, '-', ?, '-01'))) / 7))
      )
      SELECT 
        CONCAT('Minggu ', weeks.week_number) as week,
        COALESCE(SUM(p.total_bayar), 0) as total
      FROM weeks
      LEFT JOIN pesanan p 
        ON FLOOR((DAY(p.tanggal) - 1) / 7) + 1 = weeks.week_number
        AND MONTH(p.tanggal) = ?
        AND YEAR(p.tanggal) = ?
        AND p.status = 'Completed'
      GROUP BY weeks.week_number
      ORDER BY weeks.week_number ASC;
    `, [filterYear, filterMonth, filterMonth, filterYear]);

    // 5. Data Grafik Pendapatan Bulanan (Full 12 Bulan dalam Tahun Terpilih)
    const [revenueMonthly] = await db.query(`
      SELECT months.bulan as month, COALESCE(SUM(p.total_bayar), 0) as total
      FROM (
        SELECT 1 as m, 'Jan' as bulan UNION SELECT 2, 'Feb' UNION SELECT 3, 'Mar' UNION 
        SELECT 4, 'Apr' UNION SELECT 5, 'Mei' UNION SELECT 6, 'Jun' UNION 
        SELECT 7, 'Jul' UNION SELECT 8, 'Agu' UNION SELECT 9, 'Sep' UNION 
        SELECT 10, 'Okt' UNION SELECT 11, 'Nov' UNION SELECT 12, 'Des'
      ) as months
      LEFT JOIN pesanan p ON MONTH(p.tanggal) = months.m AND YEAR(p.tanggal) = ? AND p.status = 'Completed'
      GROUP BY months.m, months.bulan
      ORDER BY months.m ASC
    `, [filterYear]);

    // 6. Distribusi Status (Pie/Bar Chart)
    const [statusDist] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM pesanan 
      GROUP BY status
    `);

    // 7. Sayur Terlaris (Top 5 berdasarkan Qty)
    const [topSelling] = await db.query(`
      SELECT s.nama_sayur, SUM(d.jumlah) as total_qty
      FROM detail_pesanan d
      JOIN sayur s ON d.sayur_id = s.sayur_id
      JOIN pesanan p ON d.pesanan_id = p.pesanan_id
      WHERE p.status = 'Completed'
      GROUP BY s.sayur_id
      ORDER BY total_qty DESC
      LIMIT 5
    `);

    // 8. Kirim Response
    res.json({
      success: true,
      summary: stats[0],
      revenue: {
        daily: revenueDaily,
        weekly: revenueWeekly,
        monthly: revenueMonthly
      },
      status_distribution: statusDist,
      top_selling: topSelling
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Gagal memuat data dashboard: " + error.message 
    });
  }
};
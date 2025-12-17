import { db } from "../config/db.js";

// GET semua sayur
export const getSayur = async (req, res) => {
  const [rows] = await db.query("SELECT * FROM sayur");
  res.json(rows);
};

// ADD sayur (admin)
export const addSayur = async (req, res) => {
  const { nama_sayur, harga, stok, satuan } = req.body;

  await db.query(
    "INSERT INTO sayur (nama_sayur, harga, stok, satuan) VALUES (?, ?, ?, ?)",
    [nama_sayur, harga, stok, satuan]
  );

  res.json({ success: true, message: "Sayur berhasil ditambahkan" });
};

// UPDATE sayur
export const updateSayur = async (req, res) => {
  const { id } = req.params;
  const { harga, stok } = req.body;

  await db.query(
    "UPDATE sayur SET harga = ?, stok = ? WHERE sayur_id = ?",
    [harga, stok, id]
  );

  res.json({ success: true, message: "Sayur berhasil diupdate" });
};

// DELETE sayur
export const deleteSayur = async (req, res) => {
  const { id } = req.params;

  await db.query("DELETE FROM sayur WHERE sayur_id = ?", [id]);

  res.json({ success: true, message: "Sayur berhasil dihapus" });
};

import { db } from "../config/db.js"; // Sesuaikan dengan cara Anda import koneksi db

// 1. TAMBAH KE KERANJANG
export const addToCart = async (req, res) => {
  const { user_id, sayur_id, jumlah } = req.body;
  try {
    // Cek apakah barang sudah ada di keranjang user tersebut
    const [existing] = await db.query(
      "SELECT * FROM keranjang WHERE user_id = ? AND sayur_id = ?",
      [user_id, sayur_id]
    );

    if (existing.length > 0) {
      // Jika ada, update jumlahnya
      await db.query(
        "UPDATE keranjang SET jumlah = jumlah + ? WHERE cart_id = ?",
        [jumlah, existing[0].cart_id]
      );
    } else {
      // Jika belum ada, masukkan data baru
      await db.query(
        "INSERT INTO keranjang (user_id, sayur_id, jumlah) VALUES (?, ?, ?)",
        [user_id, sayur_id, jumlah]
      );
    }
    res.json({ success: true, message: "Berhasil ditambahkan ke keranjang" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. LIHAT ISI KERANJANG
export const getCart = async (req, res) => {
  const { user_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT c.*, s.nama_sayur, s.harga, s.satuan 
       FROM keranjang c 
       JOIN sayur s ON c.sayur_id = s.sayur_id 
       WHERE c.user_id = ?`,
      [user_id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. HAPUS SATU ITEM
export const deleteCartItem = async (req, res) => {
  const { cart_id } = req.params;
  try {
    await db.query("DELETE FROM keranjang WHERE cart_id = ?", [cart_id]);
    res.json({ success: true, message: "Item dihapus" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. UPDATE JUMLAH (Tombol + / - di UI)
export const updateCartQuantity = async (req, res) => {
  const { cart_id } = req.params;
  const { jumlah } = req.body;
  try {
    await db.query("UPDATE keranjang SET jumlah = ? WHERE cart_id = ?", [jumlah, cart_id]);
    res.json({ success: true, message: "Jumlah diperbarui" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { db } from "../config/db.js";

/**
 * ==========================
 * ADD ADDRESS
 * ==========================
 */
export const addAddress = async (req, res) => {
  const {
    user_id,
    label,
    penerima_nama,
    penerima_hp,
    alamat_lengkap,
    destination_id,
    subdistrict,
    district,
    city,
    province,
    zip_code,
    is_default
  } = req.body;

  if (
    !user_id ||
    !penerima_nama ||
    !penerima_hp ||
    !alamat_lengkap ||
    !destination_id
  ) {
    return res.json({
      success: false,
      message: "Data alamat tidak lengkap"
    });
  }

  try {
    // Jika alamat default = 1, reset default sebelumnya
    if (is_default === 1) {
      await db.query(
        "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
        [user_id]
      );
    }

    await db.query(
      `INSERT INTO user_addresses 
      (user_id, label, penerima_nama, penerima_hp, alamat_lengkap,
       destination_id, subdistrict, district, city, province, zip_code, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        label || "Alamat",
        penerima_nama,
        penerima_hp,
        alamat_lengkap,
        destination_id,
        subdistrict,
        district,
        city,
        province,
        zip_code,
        is_default || 0
      ]
    );

    res.json({
      success: true,
      message: "Alamat berhasil ditambahkan"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Gagal menambahkan alamat"
    });
  }
};

/**
 * ==========================
 * GET ADDRESS BY USER
 * ==========================
 */
export const getAddressesByUser = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC",
      [user_id]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil alamat"
    });
  }
};

/**
 * ==========================
 * GET DEFAULT ADDRESS
 * ==========================
 */
export const getDefaultAddress = async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT * FROM user_addresses WHERE user_id = ? AND is_default = 1 LIMIT 1",
      [user_id]
    );

    res.json({
      success: true,
      data: rows.length ? rows[0] : null
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil alamat default"
    });
  }
};

/**
 * ==========================
 * SET DEFAULT ADDRESS
 * ==========================
 */
export const setDefaultAddress = async (req, res) => {
  const { user_id, address_id } = req.body;

  try {
    await db.query(
      "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
      [user_id]
    );

    await db.query(
      "UPDATE user_addresses SET is_default = 1 WHERE address_id = ?",
      [address_id]
    );

    res.json({
      success: true,
      message: "Alamat default berhasil diubah"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal set alamat default"
    });
  }
};

/**
 * ==========================
 * DELETE ADDRESS
 * ==========================
 */
export const deleteAddress = async (req, res) => {
  const { address_id } = req.params;

  try {
    await db.query(
      "DELETE FROM user_addresses WHERE address_id = ?",
      [address_id]
    );

    res.json({
      success: true,
      message: "Alamat berhasil dihapus"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Gagal menghapus alamat"
    });
  }
};

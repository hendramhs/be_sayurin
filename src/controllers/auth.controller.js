import { db } from "../config/db.js";
import bcrypt from "bcryptjs";

// LOGIN
export const login = async (req, res) => {
  const { no_hp, password } = req.body;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE no_hp = ?",
    [no_hp]
  );

  if (rows.length === 0) {
    return res.json({ success: false, message: "User tidak ditemukan" });
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.json({ success: false, message: "Password salah" });
  }

  res.json({
    success: true,
    user_id: user.user_id,
    nama: user.nama,
    role: user.role
  });
};

// register
export const register = async (req, res) => {
  const { nama, no_hp, alamat, password } = req.body;

  if (!nama || !no_hp || !alamat || !password) {
    return res.json({
      success: false,
      message: "Semua field wajib diisi"
    });
  }

  // cek no_hp sudah ada
  const [check] = await db.query(
    "SELECT user_id FROM users WHERE no_hp = ?",
    [no_hp]
  );

  if (check.length > 0) {
    return res.json({
      success: false,
      message: "No HP sudah terdaftar"
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO users (nama, no_hp, alamat, role, password) VALUES (?, ?, ?, 'client', ?)",
    [nama, no_hp, alamat, hashedPassword]
  );

  res.json({
    success: true,
    message: "Registrasi berhasil"
  });
};

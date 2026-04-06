const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const generateToken = require("../config/jwt");
const generateAvatar = require("../utils/avatarGenerator");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { username, email, password, institute } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    // Check existing user
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username],
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatar = generateAvatar(username);

    // ✅ create user (NOT VERIFIED)
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, institute, profile_photo)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, institute, avatar],
    );

    const userId = result.insertId;

    // 🔢 Generate OTP (6 digit)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // ⏳ expiry (5 min)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 💾 store OTP
    await pool.query(
      `INSERT INTO email_verifications (user_id, otp_code, expires_at)
       VALUES (?, ?, ?)`,
      [userId, otp, expiresAt],
    );

    // 📧 send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: "KNest",
      to: email,
      subject: "Verify your account",
      text: `Your OTP is: ${otp}`,
    });

    res.status(201).json({
      message: "OTP sent to your email",
      userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const [rows] = await pool.query(
      `SELECT * FROM email_verifications
       WHERE user_id = ?
       AND otp_code = ?
       AND is_used = 0
       AND expires_at > NOW()`,
      [userId, otp],
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // ✅ mark user verified
    await pool.query("UPDATE users SET is_verified = 1 WHERE id = ?", [userId]);

    // ✅ mark OTP used
    await pool.query(
      "UPDATE email_verifications SET is_used = 1 WHERE id = ?",
      [rows[0].id],
    );

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = users[0];

    if (user.is_banned) {
      return res.status(403).json({ message: "Account banned" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, institute, profile_photo FROM users WHERE id = ?",
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE PROFILE (Phase 3 Requirement)
exports.updateProfile = async (req, res) => {
  try {
    const { username, institute, profile_photo } = req.body;
    
    // Ensure uniqueness if username changes
    if (username) {
        const [existing] = await pool.query(
            "SELECT id FROM users WHERE username = ? AND id != ?",
            [username, req.user.id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Username already taken." });
        }
    }

    // Dynamic update builder
    let updates = [];
    let values = [];

    if (username !== undefined) {
        updates.push("username = ?");
        values.push(username);
    }
    if (institute !== undefined) {
        updates.push("institute = ?");
        values.push(institute);
    }
    if (profile_photo !== undefined) {
        updates.push("profile_photo = ?");
        values.push(profile_photo);
    }

    if (updates.length === 0) {
        return res.status(400).json({ message: "No explicit fields provided for profile update." });
    }

    values.push(req.user.id);
    const query = `UPDATE users SET ${updates.join(", ")} WHERE id = ?`;
    
    await pool.query(query, values);

    // Fetch and return the updated user structure globally to sync the frontend UI
    const [updatedUser] = await pool.query(
      "SELECT id, username, email, institute, profile_photo FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({ 
        message: "Profile updated successfully.",
        user: updatedUser[0] 
    });
    
  } catch (error) {
    console.error("Profile Update Error: ", error);
    res.status(500).json({ message: "Server error preventing profile update" });
  }
};

const express = require("express");
const router = express.Router();
const { signup, login, logout } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { verifyEmail } = require("../controllers/authController");

router.post("/verify", verifyEmail);
router.post("/login", login);
router.post("/logout", logout);
router.post("/register", signup);

router.get("/test", (req, res) => {
  res.json({ message: "Auth route working" });
});

const { getMe, updateProfile } = require("../controllers/authController");
router.get("/me", authMiddleware, getMe);
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;

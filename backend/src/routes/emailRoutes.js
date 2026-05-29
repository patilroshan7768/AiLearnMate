const express = require("express");
const router = express.Router();

const { sendOtp } = require("../controllers/emailController");

// POST /api/email/send-otp
router.post("/send-otp", sendOtp);

module.exports = router;

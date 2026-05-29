# Backend Implementation: OTP Expiration (1 Minute)

This guide outlines how to implement a 1-minute expiration for One-Time Passwords (OTP) in your backend. This ensures that OTPs for password resets or verifications are only valid for a short period.

## 1. Update User Model (`models/User.js`)

Ensure your User schema has fields to store the OTP and its expiration time.

```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ... other fields (name, email, password)
  
  resetOtp: {
    type: String,
    default: null
  },
  resetOtpExpiry: { // <--- ADD THIS FIELD
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('User', userSchema);
```

## 2. Update Auth Controller (`controllers/authController.js`)

Modify your `sendOtp` and `resetPassword` (or `verifyOtp`) functions to handle the expiration logic.

### A. Sending the OTP (Set Expiration)

When generating the OTP, set the expiration time to **1 minute** from now.

```javascript
// controllers/authController.js

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Save OTP and Expiration to Database
        user.resetOtp = otp;
        user.resetOtpExpiry = Date.now() + 60000; // Current time + 1 minute (60,000 ms)
        await user.save();

        // Send Email Logic Here...
        console.log(`OTP for ${email}: ${otp}`); // For testing

        res.json({ message: "OTP sent successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
```

### B. Verifying the OTP (Check Expiration)

When the user submits the OTP, check if the current time is past the expiration time.

```javascript
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 1. Check if OTP matches
        if (user.resetOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // 2. Check if OTP is expired
        if (Date.now() > user.resetOtpExpiry) {
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        // 3. Reset Password
        user.password = newPassword; // Remember to hash this if not using pre-save hooks
        user.resetOtp = null;       // Clear OTP
        user.resetOtpExpiry = null; // Clear Expiry
        await user.save();

        res.json({ message: "Password reset successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
```

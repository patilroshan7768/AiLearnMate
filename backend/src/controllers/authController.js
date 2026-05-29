const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');
const { logAction } = require('../utils/logger');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Temporary storage for OTP (In production use Redis or Database)
// Structure: Map<email, { otp: string, expiresAt: number }>
const otpStore = new Map();

// Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (userEmail, otpCode) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email credentials not set. Skipping email send.");
      return;
    }
    await transporter.sendMail({
      from: `"AI LearnMate" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Your Verification Code",
      text: `Your Code is: ${otpCode}`,
      html: `<h3>Welcome to AI LearnMate!</h3><p>Your Verification Code is: <b>${otpCode}</b></p><p>This code expires in 1 minute.</p>`
    });
    console.log(`Verification email sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send verification email:", error);
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const normalizedEmail = email.toLowerCase();

    // If this is for Password Reset, ensure user exists
    if (type === 'reset') {
      const existingUser = await User.findOne({ where: { email: normalizedEmail } });
      if (!existingUser) {
        return res.status(404).json({ success: false, message: "Email not registered. Please sign up." });
      }
    }

    // Generate 4 digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Set expiration time to 1 minute from now
    const expiresAt = Date.now() + 1 * 60 * 1000;

    // Store OTP and expiration time
    otpStore.set(normalizedEmail, { otp, expiresAt });
    console.log(`=== OTP for ${normalizedEmail}: ${otp} (Expires in 1m) ===`);

    // Send via Email
    await sendVerificationEmail(normalizedEmail, otp);

    // SIMULATION MODE: Return OTP in response
    res.status(200).json({
      success: true,
      message: "OTP sent successfully. Valid for 1 minute.",
      data: { otp }
    });
  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP", error: error.message });
  }
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role, otp } = req.body;
    const normalizedEmail = email.toLowerCase();

    // 1. Verify OTP
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    // Check if expired
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail); // Cleanup expired OTP
      return res.status(400).json({ success: false, message: "Invalid OTP (Expired). Please request a new one." });
    }

    // Check if OTP matches
    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role || 'student'
    });

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    // 3. Clear OTP after success
    otpStore.delete(normalizedEmail);

    // Log action
    await logAction(user.id, 'user_registered', 'success');

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ // Changed to 404 for specific "Not Found" handling
        success: false,
        message: 'Email not registered'
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Check if account is active (Admin approval required)
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. You will be able to log in once activated by an administrator.'
      });
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    // Log action
    await logAction(user.id, 'user_login', 'success');

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Email, OTP, and new password are required." });
    }

    const normalizedEmail = email.toLowerCase();

    // 1. Verify OTP
    const record = otpStore.get(normalizedEmail);

    if (!record) {
      return res.status(400).json({ success: false, message: "No OTP found. Please request a new one." });
    }

    // Check if expired
    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalizedEmail);
      return res.status(400).json({ success: false, message: "Invalid OTP (Expired). Please request a new one." });
    }

    // Check if OTP matches
    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // 2. Find User
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: "Email not registered." });
    }

    // 3. Update Password
    user.password = newPassword;
    // Sequelize hook will hash it automatically because of:
    // beforeUpdate: async (user) => { if (user.changed('password')) ... }

    await user.save();

    // 4. Clear OTP
    otpStore.delete(normalizedEmail);

    res.status(200).json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: "Failed to reset password.", error: error.message });
  }
};

const adminGetUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

const adminApproveTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.is_active = true;
    await user.save();
    res.status(200).json({ success: true, message: 'Teacher approved and activated successfully', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve teacher', error: error.message });
  }
};

const adminUpdateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ success: true, message: 'User role updated successfully', data: { user } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update role', error: error.message });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await user.destroy();
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, profile_image, profession } = req.body;
    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (profile_image !== undefined) user.profile_image = profile_image;
    if (profession) user.profession = profession;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_image: user.profile_image, profession: user.profession } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.', error: error.message });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile, 
  sendOtp, 
  resetPassword,
  updateProfile,
  adminGetUsers,
  adminApproveTeacher,
  adminUpdateUserRole,
  adminDeleteUser
};

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- SIMULATED OTP STORE ---
// In production, this would use Redis or memory cache with an expiration
const mockOtpStore = {};

// @route   POST api/auth/send-otp
// @desc    Simulate sending an OTP to a phone number
// @access  Public
router.post('/send-otp', (req, res) => {
    const { phone_number } = req.body;
    
    if (!phone_number) {
        return res.status(400).json({ success: false, error: "Phone number is required" });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    mockOtpStore[phone_number] = otp;

    // Simulate Twilio API delay
    setTimeout(() => {
        // Send the OTP back in the response for easy testing
        // In reality, you'd only return success: true
        res.json({ 
            success: true, 
            message: "OTP sent successfully",
            _dev_otp: otp // MOCK VISIBILITY
        });
    }, 1000);
});

// @route   POST api/auth/verify-otp
// @desc    Verify the 6-digit code matches the stored OTP
// @access  Public
router.post('/verify-otp', (req, res) => {
    const { phone_number, otp } = req.body;

    if (!phone_number || !otp) {
        return res.status(400).json({ success: false, error: "Phone number and OTP required" });
    }

    const storedOtp = mockOtpStore[phone_number];

    if (!storedOtp) {
        return res.status(400).json({ success: false, error: "No OTP requested for this number or it expired" });
    }

    if (storedOtp === otp) {
        // Clear OTP after successful use
        delete mockOtpStore[phone_number];
        res.json({ success: true, message: "Phone number verified" });
    } else {
        res.status(400).json({ success: false, error: "Invalid OTP code" });
    }
});

// @route   POST api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { first_name, last_name, phone_number, username, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ $or: [{ email }, { phone: phone_number }, { username }] });
        if (user) {
            return res.status(400).json({ success: false, error: "User already exists with that email, phone, or username" });
        }

        // Determine role (for demo purposes, let's make anyone with 'admin' in username an admin, 'officer' an officer, else citizen)
        let role = 'citizen';
        if (username.toLowerCase().includes('admin')) role = 'admin';
        if (username.toLowerCase().includes('officer')) role = 'officer';

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        user = new User({
            firstName: first_name,
            lastName: last_name,
            phone: phone_number,
            username,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        res.json({ success: true, message: "Account created successfully", role });

    } catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, error: "Invalid Credentials" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: "Invalid Credentials" });
        }

        // Return JWT
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ 
                    success: true, 
                    token, 
                    role: user.role,
                    username: user.username
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

module.exports = router;

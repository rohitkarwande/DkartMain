const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { sendOTP: sendPhoneOTP } = require("../config/twilio");
const { sendEmailOTP } = require("../config/email");
const cache = require("../config/cache");
const { OAuth2Client } = require("google-auth-library");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

// Helper to determine if input is email or phone
const isEmail = (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);

const sendOtp = async (req, res) => {
  let { identifier, action } = req.body; // action can be 'login' or 'register'

  if (!identifier) {
    return res
      .status(400)
      .json({ error: "Please provide an email or phone number" });
  }

  identifier = identifier.trim();
  let type = isEmail(identifier) ? "email" : "phone";

  if (type === "email") {
    identifier = identifier.toLowerCase();
  } else if (type === "phone" && !identifier.startsWith("+")) {
    // Automatically prepend +91 for Indian numbers if not provided
    identifier = "+91" + identifier;
  }

  try {
    // Find user
    let result = await db.query(`SELECT id FROM users WHERE ${type} = $1`, [
      identifier,
    ]);
    let userId;

    if (action === "login") {
      if (result.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "User not registered, please register first." });
      }
      userId = result.rows[0].id;
    } else if (action === "register") {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "User already registered, please login." });
      }
      // Create pending user
      const insertResult = await db.query(
        `INSERT INTO users (${type}) VALUES ($1) RETURNING id`,
        [identifier],
      );
      userId = insertResult.rows[0].id;
    } else {
      // Default fallback if action not provided (legacy support)
      if (result.rows.length === 0) {
        const insertResult = await db.query(
          `INSERT INTO users (${type}) VALUES ($1) RETURNING id`,
          [identifier],
        );
        userId = insertResult.rows[0].id;
      } else {
        userId = result.rows[0].id;
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in Redis (cache abstract) for 5 minutes (300 seconds)
    await cache.setEx(`otp:${userId}`, 300, otp);

    // Development/Admin helper: Always log OTP to server console
    console.log(`[OTP DEBUG] Generated OTP for ${identifier} (User ID: ${userId}): ${otp}`);

    // Send OTP
    if (type === "email") {
      try {
        await sendEmailOTP(identifier, otp);
        console.log(`✅ OTP sent to email: ${identifier}`);
      } catch (emailError) {
        console.error(`⚠️ Failed to deliver OTP email to ${identifier}:`, emailError.message);
        console.log(`🔑 FALLBACK OTP for ${identifier}: ${otp} (valid 5 min)`);
      }
    } else {
      await sendPhoneOTP(identifier, otp);
    }

    res.json({ message: `OTP sent to your ${type}`, userId, type });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error while sending OTP" });
  }
};

const verifyOtp = async (req, res) => {
  const rawUserId = req.body.userId;
  const otp = req.body.otp;
  const userId = Number.isInteger(rawUserId)
    ? rawUserId
    : parseInt(rawUserId, 10);

  if (!userId || !otp) {
    return res.status(400).json({ error: "User ID and OTP are required" });
  }

  let rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'Unknown';
  if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') rawIp = '127.0.0.1 (Localhost)';
  const ipAddress = rawIp;
  const userAgent = req.headers['user-agent'] || 'Unknown';

  try {
    // 1. Check IP Blacklist
    const blacklistCheck = await db.query('SELECT reason FROM ip_blacklist WHERE ip_address = $1', [ipAddress]);
    if (blacklistCheck.rows.length > 0) {
      return res.status(403).json({ error: "Access denied from this IP address." });
    }

    const cachedOtp = await cache.get(`otp:${userId}`);

    if (!cachedOtp || cachedOtp !== otp) {
      return res.status(401).json({ error: "Invalid or expired OTP" });
    }

    // OTP matches, clear it from cache
    await cache.del(`otp:${userId}`);

    // Check if user was already verified before we update
    const previousState = await db.query("SELECT is_verified FROM users WHERE id = $1", [userId]);
    const wasVerified = previousState.rows[0]?.is_verified;

    // Mark user as verified
    await db.query("UPDATE users SET is_verified = TRUE WHERE id = $1", [
      userId,
    ]);

    // Fetch user to generate token and return profile state
    const result = await db.query(
      `SELECT u.id, u.email, u.phone, u.role, p.profession, p.location
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.id = $1`,
      [userId],
    );
    const user = result.rows[0];

    if (!user) {
      console.error("OTP verification failed: user not found", { userId });
      return res
        .status(500)
        .json({ error: "Server error during OTP verification" });
    }

    // Trigger admin notification if new user just verified
    if (!wasVerified) {
        const { notifyAdmins } = require('../services/adminNotificationService');
        notifyAdmins(req.io, 'NEW_USER', `A new user has registered with ${user.email || user.phone}`, user.id);

        // Email all admins about the new registration
        const { emailNewRegistration } = require('../services/emailService');
        emailNewRegistration(user.email || user.phone, user.id);
    }

    // IP Tracking & Alerts
    const ipCheck = await db.query('SELECT id FROM login_history WHERE user_id = $1 AND ip_address = $2 LIMIT 1', [userId, ipAddress]);
    const isNewIp = ipCheck.rows.length === 0;

    await db.query('INSERT INTO login_history (user_id, ip_address, user_agent) VALUES ($1, $2, $3)', [userId, ipAddress, userAgent]);

    // Send warning email if this is a new IP and the user already existed (not a brand new registration)
    if (isNewIp && wasVerified && user.email) {
        const { emailNewLoginAlert } = require('../services/emailService');
        emailNewLoginAlert(user.email, ipAddress, userAgent).catch(err => console.error('Failed to send login alert:', err));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Server error during OTP verification" });
  }
};

const googleLogin = async (req, res) => {
  const { credential, email: mockEmail, name: mockName, isMock } = req.body;

  let email = mockEmail;
  let name = mockName;

  if (googleClient && credential && !isMock) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } catch (verifyError) {
      console.error("Google ID Token verification failed:", verifyError.message);
      return res.status(401).json({ error: "Invalid or expired Google identity token" });
    }
  } else {
    console.log(`[Google Auth] Simulated login for ${email} (Name: ${name})`);
  }

  if (!email) {
    return res.status(400).json({ error: "Email is required for Google Sign-In" });
  }

  const lowercaseEmail = email.toLowerCase().trim();

  try {
    // 1. Check if user already exists
    let result = await db.query(
      "SELECT id, email, phone, role, is_verified FROM users WHERE email = $1",
      [lowercaseEmail]
    );
    let user;

    if (result.rows.length === 0) {
      // 2. If user doesn't exist, create a new user (with is_verified = TRUE)
      const insertResult = await db.query(
        "INSERT INTO users (email, role, is_verified, status) VALUES ($1, 'user', TRUE, 'Active') RETURNING id, email, phone, role, is_verified",
        [lowercaseEmail]
      );
      user = insertResult.rows[0];

      // Save user profile with name if provided
      if (name) {
        const spaceIndex = name.indexOf(" ");
        const firstName = spaceIndex !== -1 ? name.substring(0, spaceIndex) : name;
        const lastName = spaceIndex !== -1 ? name.substring(spaceIndex + 1) : "";

        await db.query(
          "INSERT INTO user_profiles (user_id, first_name, last_name) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING",
          [user.id, firstName, lastName]
        );
      }
    } else {
      user = result.rows[0];
      // Ensure user status is active and verified
      await db.query("UPDATE users SET is_verified = TRUE, status = 'Active' WHERE id = $1", [user.id]);
    }

    // 3. Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 4. Fetch full user profile
    const profileRes = await db.query(
      `SELECT u.id, u.email, u.phone, u.role, p.first_name, p.last_name, p.profession, p.location
       FROM users u 
       LEFT JOIN user_profiles p ON u.id = p.user_id 
       WHERE u.id = $1`,
      [user.id]
    );

    res.json({
      message: "Google login successful",
      token,
      user: profileRes.rows[0]
    });
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    res.status(500).json({ error: "Server error during Google Sign-In" });
  }
};

const logout = async (req, res) => {
  // In a stateless JWT setup, logout is typically handled client-side by deleting the token.
  // We can also clear cookies if they were used.
  res.json({ message: "Logout successful" });
};

module.exports = { sendOtp, verifyOtp, googleLogin, logout };


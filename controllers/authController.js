const authService = require('../services/auth/authService');

const sendOtp = async (req, res) => {
    try {
        const { identifier, action } = req.body;
        const result = await authService.sendOtp(identifier, action);
        res.json(result);
    } catch (error) {
        console.error('Error in sendOtp:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error while sending OTP' });
    }
};

const verifyOtp = async (req, res) => {
    try {
        const rawUserId = req.body.userId;
        const otp = req.body.otp;

        let rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'Unknown';
        if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') rawIp = '127.0.0.1 (Localhost)';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        const result = await authService.verifyAuthOtp({
            rawUserId,
            otp,
            ipAddress: rawIp,
            userAgent,
            io: req.io
        });

        res.json(result);
    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error during OTP verification' });
    }
};

const googleLogin = async (req, res) => {
    try {
        const { credential, email, name, isMock } = req.body;
        const result = await authService.loginWithGoogle({
            credential,
            mockEmail: email,
            mockName: name,
            isMock
        });
        res.json(result);
    } catch (error) {
        console.error('Error in googleLogin:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error during Google Sign-In' });
    }
};

const logout = async (req, res) => {
    res.json({ message: 'Logout successful' });
};

module.exports = {
    sendOtp,
    verifyOtp,
    googleLogin,
    logout
};

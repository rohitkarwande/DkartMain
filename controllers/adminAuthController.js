const authService = require('../services/auth/authService');

/**
 * Request Dual OTP (Email + Mobile) for Admin Verification
 */
const requestDualOtp = async (req, res) => {
    let { identifier } = req.body;

    if (!identifier && req.user) {
        identifier = req.user.email || req.user.phone;
    }

    try {
        const result = await authService.requestAdminDualOtp(identifier);
        res.json(result);
    } catch (error) {
        console.error('Admin request dual OTP error:', error);
        const responsePayload = { error: error.message || 'Server error processing admin verification request.' };
        if (error.missingContact) {
            responsePayload.missingContact = error.missingContact;
        }
        res.status(error.statusCode || 500).json(responsePayload);
    }
};

/**
 * Verify Dual OTP (Email + Mobile) and Issue Elevated Admin Token
 */
const verifyDualOtp = async (req, res) => {
    const rawUserId = req.body.userId;
    const emailOtp = req.body.emailOtp;
    const mobileOtp = req.body.mobileOtp;

    let rawIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'Unknown';
    if (rawIp === '::1' || rawIp === '::ffff:127.0.0.1') rawIp = '127.0.0.1 (Localhost)';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    try {
        const result = await authService.verifyAdminDualOtp({
            rawUserId,
            emailOtp,
            mobileOtp,
            ipAddress: rawIp,
            userAgent
        });
        res.json(result);
    } catch (error) {
        console.error('Admin verify dual OTP error:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error during admin verification.' });
    }
};

/**
 * Verify current Admin 2FA Session Status
 */
const checkAdminSession = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'admin' || !req.user.admin2Fa) {
            return res.status(403).json({ valid: false, error: 'Admin 2FA session expired or not verified.' });
        }
        res.json({
            valid: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                phone: req.user.phone,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ valid: false, error: 'Error checking admin session' });
    }
};

module.exports = {
    requestDualOtp,
    verifyDualOtp,
    checkAdminSession
};

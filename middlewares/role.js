/**
 * Role-Based Access Control middleware factory.
 * Usage: requireRole('admin'), requireRole('admin', 'seller'), etc.
 */
const requireRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        // If route requires admin, enforce that admin passed dual 2FA verification
        if (roles.includes('admin') && req.user.role === 'admin' && !req.user.admin2Fa) {
            return res.status(403).json({
                error: 'Admin 2FA verification required. Please verify via the secret admin portal.',
                require2Fa: true
            });
        }
        return next();
    }
    return res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(', ')}.` });
};

// Backward-compatible alias for existing admin routes
const isAdmin = requireRole('admin');

module.exports = { requireRole, isAdmin };
module.exports.default = isAdmin; // extra safety for require() without destructure

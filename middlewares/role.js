/**
 * Role-Based Access Control middleware factory.
 * Usage: requireRole('admin'), requireRole('admin', 'seller'), etc.
 */
const requireRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
        return next();
    }
    return res.status(403).json({ error: `Access denied. Required role(s): ${roles.join(', ')}.` });
};

// Backward-compatible alias for existing admin routes
const isAdmin = requireRole('admin');

module.exports = { requireRole, isAdmin };
module.exports.default = isAdmin; // extra safety for require() without destructure

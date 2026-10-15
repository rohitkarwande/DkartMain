const auditService = require('../services/admin/auditService');

const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        res.json = function (body) {
            res.json = originalJson;
            
            // Log if successful status code
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user ? req.user.id : null;
                const ip = req.ip || req.connection?.remoteAddress;
                const entityId = req.params?.id || null;
                
                auditService.logAction({
                    userId,
                    action,
                    entityType,
                    entityId,
                    ipAddress: ip
                });
            }
            
            return res.json(body);
        };
        next();
    };
};

module.exports = auditLog;


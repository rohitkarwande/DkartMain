const db = require('../../config/db');

class AuditService {
    /**
     * Records an audit entry in the audit_logs table
     */
    async logAction({ userId = null, action, entityType = null, entityId = null, ipAddress = null, changes = null }) {
        if (!action) return;

        try {
            await db.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, changes)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    userId,
                    action,
                    entityType,
                    entityId ? String(entityId) : null,
                    ipAddress,
                    changes ? JSON.stringify(changes) : null
                ]
            );
        } catch (error) {
            // Non-blocking error handling
            console.error('AuditService Error:', error.message);
        }
    }

    /**
     * Fetches audit logs for admin audit viewer
     */
    async getAuditLogs({ limit = 50, offset = 0, action = null, entityType = null } = {}) {
        let query = `
            SELECT al.*, u.email as user_email, u.role as user_role
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
        `;
        const params = [];
        const conditions = [];

        if (action) {
            conditions.push(`al.action = $${params.length + 1}`);
            params.push(action);
        }
        if (entityType) {
            conditions.push(`al.entity_type = $${params.length + 1}`);
            params.push(entityType);
        }

        if (conditions.length > 0) {
            query += ` WHERE ` + conditions.join(' AND ');
        }

        query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    }
}

module.exports = new AuditService();

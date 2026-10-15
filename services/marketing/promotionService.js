const db = require('../../config/db');

class PromotionService {
    /**
     * Check if paid promotions are globally enabled
     */
    async isGloballyEnabled() {
        const flagRes = await db.query("SELECT is_enabled FROM feature_flags WHERE key = 'enable_paid_promotions'");
        return flagRes.rows.length > 0 ? flagRes.rows[0].is_enabled : false;
    }

    /**
     * Check if user is permitted to use paid promotions
     */
    async isUserAllowed(userId) {
        const userRes = await db.query("SELECT paid_promotions_enabled, role FROM users WHERE id = $1", [userId]);
        if (userRes.rows.length === 0) return false;
        const user = userRes.rows[0];
        return user.role === 'admin' || user.paid_promotions_enabled === true;
    }

    /**
     * Fetch active promotion plans
     */
    async getPlans() {
        const isEnabled = await this.isGloballyEnabled();
        if (!isEnabled) {
            const err = new Error('Paid promotions are currently disabled globally by the administrator.');
            err.statusCode = 403;
            throw err;
        }

        const result = await db.query(
            `SELECT id, name, type, price, duration_days, description
             FROM promotion_plans
             WHERE is_active = true
             ORDER BY type ASC, price ASC`
        );
        return result.rows;
    }

    /**
     * Submit a promotion request for a listing
     */
    async requestPromotion({ sellerId, equipment_post_id, plan_id }) {
        const isGlobal = await this.isGloballyEnabled();
        if (!isGlobal) {
            const err = new Error('Paid promotions are currently disabled globally by the administrator.');
            err.statusCode = 403;
            throw err;
        }

        const isAllowed = await this.isUserAllowed(sellerId);
        if (!isAllowed) {
            const err = new Error('You do not have permission to use paid promotions. Please request access from the administrator.');
            err.statusCode = 403;
            throw err;
        }

        if (!equipment_post_id || !plan_id) {
            const err = new Error('equipment_post_id and plan_id are required');
            err.statusCode = 400;
            throw err;
        }

        // Verify equipment belongs to seller
        const postCheck = await db.query(
            `SELECT id FROM equipment_posts WHERE id = $1 AND seller_id = $2 AND status != 'Archived'`,
            [equipment_post_id, sellerId]
        );
        if (postCheck.rows.length === 0) {
            const err = new Error('Equipment not found or does not belong to you');
            err.statusCode = 404;
            throw err;
        }

        // Verify plan exists
        const planCheck = await db.query(
            `SELECT id, type, price, duration_days, name FROM promotion_plans WHERE id = $1 AND is_active = true`,
            [plan_id]
        );
        if (planCheck.rows.length === 0) {
            const err = new Error('Promotion plan not found');
            err.statusCode = 404;
            throw err;
        }
        const plan = planCheck.rows[0];

        // Check if there's already an active/pending promotion of same type
        const existing = await db.query(
            `SELECT id FROM promotions
             WHERE equipment_post_id = $1 AND type = $2 AND status IN ('Pending', 'Active')`,
            [equipment_post_id, plan.type]
        );
        if (existing.rows.length > 0) {
            const err = new Error(`This listing already has a ${plan.type} promotion that is Pending or Active.`);
            err.statusCode = 400;
            throw err;
        }

        // Create the promotion
        const result = await db.query(
            `INSERT INTO promotions (seller_id, equipment_post_id, plan_id, type, status, payment_reference)
             VALUES ($1, $2, $3, $4, 'Pending', $5)
             RETURNING *`,
            [sellerId, equipment_post_id, plan_id, plan.type, `MOCK-${Date.now()}`]
        );

        return {
            promotion: result.rows[0],
            plan
        };
    }

    /**
     * Get promotions belonging to a seller (with performance metrics)
     */
    async getMyPromotions(sellerId) {
        const isGlobal = await this.isGloballyEnabled();
        if (!isGlobal) {
            const err = new Error('Paid promotions are currently disabled globally by the administrator.');
            err.statusCode = 403;
            throw err;
        }

        const isAllowed = await this.isUserAllowed(sellerId);
        if (!isAllowed) {
            const err = new Error('You do not have permission to use paid promotions.');
            err.statusCode = 403;
            throw err;
        }

        const result = await db.query(
            `SELECT p.*, pp.name as plan_name, pp.price as plan_price, pp.duration_days,
                    ep.title as equipment_title, ep.category as equipment_category,
                    (SELECT image_url FROM equipment_images WHERE equipment_post_id = ep.id AND media_type = 'image' ORDER BY display_order ASC LIMIT 1) as equipment_image,
                    hb.id as banner_id,
                    COALESCE(hb.views_count, p.views_count, 0) as banner_views,
                    COALESCE(hb.clicks_count, p.clicks_count, 0) as banner_clicks,
                    COALESCE(em.view_count, 0) as product_views,
                    COALESCE(em.click_count, 0) as product_clicks,
                    COALESCE(em.inquiry_count, 0) as product_inquiries
             FROM promotions p
             JOIN promotion_plans pp ON p.plan_id = pp.id
             JOIN equipment_posts ep ON p.equipment_post_id = ep.id
             LEFT JOIN hero_banners hb ON (hb.promotion_id = p.id OR (hb.equipment_post_id = p.equipment_post_id AND p.type = 'carousel'))
             LEFT JOIN engagement_metrics em ON em.equipment_post_id = p.equipment_post_id
             WHERE p.seller_id = $1
             ORDER BY p.created_at DESC`,
            [sellerId]
        );

        return result.rows;
    }

    /**
     * Admin list all promotions
     */
    async adminListPromotions(status = null) {
        let query = `
            SELECT p.*, pp.name as plan_name, pp.price as plan_price, pp.duration_days,
                   ep.title as equipment_title, ep.category as equipment_category,
                   u.email as seller_email, up.company_name as seller_company
            FROM promotions p
            JOIN promotion_plans pp ON p.plan_id = pp.id
            JOIN equipment_posts ep ON p.equipment_post_id = ep.id
            JOIN users u ON p.seller_id = u.id
            LEFT JOIN user_profiles up ON p.seller_id = up.user_id
        `;
        const params = [];
        if (status) {
            query += ` WHERE p.status = $1`;
            params.push(status);
        }
        query += ` ORDER BY p.created_at DESC`;

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Admin update promotion status (Active or Rejected)
     */
    async adminUpdatePromotionStatus(id, { status, admin_note = null }) {
        if (!['Active', 'Rejected'].includes(status)) {
            const err = new Error('Status must be "Active" or "Rejected"');
            err.statusCode = 400;
            throw err;
        }

        const promoCheck = await db.query(
            `SELECT p.*, pp.duration_days, pp.type as plan_type FROM promotions p
             JOIN promotion_plans pp ON p.plan_id = pp.id
             WHERE p.id = $1`,
            [id]
        );
        if (promoCheck.rows.length === 0) {
            const err = new Error('Promotion not found');
            err.statusCode = 404;
            throw err;
        }
        const promo = promoCheck.rows[0];

        let startsAt = null;
        let expiresAt = null;

        if (status === 'Active') {
            startsAt = new Date();
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + promo.duration_days);
        }

        await db.query(
            `UPDATE promotions 
             SET status = $1, starts_at = $2, expires_at = $3, admin_note = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [status, startsAt, expiresAt, admin_note || null, id]
        );

        // If carousel type is approved, auto-create a hero banner
        if (status === 'Active' && promo.type === 'carousel') {
            await this.autoCreateCarouselBanner(promo);
        }

        return { id, status };
    }

    /**
     * Helper: auto-create a hero banner when a carousel promotion is approved
     */
    async autoCreateCarouselBanner(promo) {
        try {
            const equipRes = await db.query(
                `SELECT ep.title, ep.category, ep.id,
                        (SELECT image_url FROM equipment_images WHERE equipment_post_id = ep.id AND media_type = 'image' ORDER BY display_order ASC LIMIT 1) as first_image
                 FROM equipment_posts ep WHERE ep.id = $1`,
                [promo.equipment_post_id]
            );
            if (equipRes.rows.length === 0) return;
            const equip = equipRes.rows[0];

            if (!equip.first_image) return;

            await db.query(
                `INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active, seller_id, equipment_post_id, promotion_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                [
                    equip.title,
                    `Featured ${equip.category} Equipment`,
                    'Sponsored',
                    equip.first_image,
                    `/equipment/${equip.id}`,
                    'View Listing',
                    99,
                    true,
                    promo.seller_id,
                    promo.equipment_post_id,
                    promo.id
                ]
            );
            console.log(`✅ Auto-created hero banner for carousel promotion (equipment: ${equip.id})`);
        } catch (err) {
            console.error('Failed to auto-create carousel banner:', err.message);
        }
    }
}

module.exports = new PromotionService();

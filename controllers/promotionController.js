const db = require('../config/db');

const sendError = (res, message, status = 400) => res.status(status).json({ error: message });

// ─── PUBLIC ────────────────────────────────────────────────────────────────────

// GET /api/promotions/plans — list all active promotion plans
const getPlans = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, type, price, duration_days, description
             FROM promotion_plans
             WHERE is_active = true
             ORDER BY type ASC, price ASC`
        );
        res.json({ plans: result.rows });
    } catch (err) {
        console.error(err);
        sendError(res, 'Failed to fetch promotion plans', 500);
    }
};

// ─── SELLER ────────────────────────────────────────────────────────────────────

// POST /api/promotions/request — seller submits a promotion request
const requestPromotion = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { equipment_post_id, plan_id } = req.body;

        if (!equipment_post_id || !plan_id) {
            return sendError(res, 'equipment_post_id and plan_id are required');
        }

        // Verify the equipment belongs to the seller
        const postCheck = await db.query(
            `SELECT id FROM equipment_posts WHERE id = $1 AND seller_id = $2 AND status != 'Archived'`,
            [equipment_post_id, sellerId]
        );
        if (postCheck.rows.length === 0) {
            return sendError(res, 'Equipment not found or does not belong to you', 404);
        }

        // Verify the plan exists
        const planCheck = await db.query(
            `SELECT id, type, price, duration_days, name FROM promotion_plans WHERE id = $1 AND is_active = true`,
            [plan_id]
        );
        if (planCheck.rows.length === 0) {
            return sendError(res, 'Promotion plan not found', 404);
        }
        const plan = planCheck.rows[0];

        // Check if there's already a Pending or Active promotion of the same type for this listing
        const existing = await db.query(
            `SELECT id FROM promotions
             WHERE equipment_post_id = $1 AND type = $2 AND status IN ('Pending', 'Active')`,
            [equipment_post_id, plan.type]
        );
        if (existing.rows.length > 0) {
            return sendError(res, `This listing already has a ${plan.type} promotion that is Pending or Active.`);
        }

        // Create the promotion (mock payment — status = Pending until admin approves)
        const result = await db.query(
            `INSERT INTO promotions (seller_id, equipment_post_id, plan_id, type, status, payment_reference)
             VALUES ($1, $2, $3, $4, 'Pending', $5)
             RETURNING *`,
            [sellerId, equipment_post_id, plan_id, plan.type, `MOCK-${Date.now()}`]
        );

        res.status(201).json({
            message: `Promotion request submitted successfully! Our team will activate your "${plan.name}" within 24 hours.`,
            promotion: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        sendError(res, 'Failed to submit promotion request', 500);
    }
};

// GET /api/promotions/mine — seller sees their own promotions
const getMyPromotions = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const result = await db.query(
            `SELECT p.*, pp.name as plan_name, pp.price as plan_price, pp.duration_days,
                    ep.title as equipment_title, ep.category as equipment_category
             FROM promotions p
             JOIN promotion_plans pp ON p.plan_id = pp.id
             JOIN equipment_posts ep ON p.equipment_post_id = ep.id
             WHERE p.seller_id = $1
             ORDER BY p.created_at DESC`,
            [sellerId]
        );
        res.json({ promotions: result.rows });
    } catch (err) {
        console.error(err);
        sendError(res, 'Failed to fetch your promotions', 500);
    }
};

// ─── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/promotions/admin — admin lists all promotions
const adminListPromotions = async (req, res) => {
    try {
        const { status } = req.query;
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
        res.json({ promotions: result.rows });
    } catch (err) {
        console.error(err);
        sendError(res, 'Failed to fetch promotions', 500);
    }
};

// PATCH /api/promotions/:id/status — admin approves or rejects
const adminUpdatePromotionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        if (!['Active', 'Rejected'].includes(status)) {
            return sendError(res, 'Status must be "Active" or "Rejected"');
        }

        const promoCheck = await db.query(
            `SELECT p.*, pp.duration_days, pp.type as plan_type FROM promotions p
             JOIN promotion_plans pp ON p.plan_id = pp.id
             WHERE p.id = $1`,
            [id]
        );
        if (promoCheck.rows.length === 0) {
            return sendError(res, 'Promotion not found', 404);
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
            await _autoCreateCarouselBanner(promo);
        }

        res.json({ message: `Promotion ${status === 'Active' ? 'activated' : 'rejected'} successfully.` });
    } catch (err) {
        console.error(err);
        sendError(res, 'Failed to update promotion status', 500);
    }
};

// Helper: auto-create a hero banner when a carousel promotion is approved
async function _autoCreateCarouselBanner(promo) {
    try {
        // Get equipment details + first image
        const equipRes = await db.query(
            `SELECT ep.title, ep.category, ep.id,
                    (SELECT image_url FROM equipment_images WHERE equipment_post_id = ep.id AND media_type = 'image' ORDER BY display_order ASC LIMIT 1) as first_image
             FROM equipment_posts ep WHERE ep.id = $1`,
            [promo.equipment_post_id]
        );
        if (equipRes.rows.length === 0) return;
        const equip = equipRes.rows[0];

        if (!equip.first_image) return; // Can't create carousel without image

        await db.query(
            `INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                equip.title,
                `Featured ${equip.category} Equipment`,
                'Sponsored',
                equip.first_image,
                `/equipment/${equip.id}`,
                'View Listing',
                99, // Lower priority than manually placed banners
                true
            ]
        );
        console.log(`✅ Auto-created hero banner for carousel promotion (equipment: ${equip.id})`);
    } catch (err) {
        console.error('Failed to auto-create carousel banner:', err.message);
        // Non-fatal — don't throw
    }
}

module.exports = {
    getPlans,
    requestPromotion,
    getMyPromotions,
    adminListPromotions,
    adminUpdatePromotionStatus,
};

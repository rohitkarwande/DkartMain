const promotionService = require('../services/marketing/promotionService');

const sendError = (res, message, status = 400) => res.status(status).json({ error: message });

// ─── PUBLIC ────────────────────────────────────────────────────────────────────

// GET /api/promotions/plans — list all active promotion plans
const getPlans = async (req, res) => {
    try {
        const plans = await promotionService.getPlans();
        res.json({ plans });
    } catch (err) {
        console.error('getPlans error:', err.message);
        sendError(res, err.message || 'Failed to fetch promotion plans', err.statusCode || 500);
    }
};

// ─── SELLER ────────────────────────────────────────────────────────────────────

// POST /api/promotions/request — seller submits a promotion request
const requestPromotion = async (req, res) => {
    try {
        const sellerId = req.user.id;
        const { equipment_post_id, plan_id } = req.body;

        const { promotion, plan } = await promotionService.requestPromotion({
            sellerId,
            equipment_post_id,
            plan_id
        });

        res.status(201).json({
            message: `Promotion request submitted successfully! Our team will activate your "${plan.name}" within 24 hours.`,
            promotion
        });
    } catch (err) {
        console.error('requestPromotion error:', err.message);
        sendError(res, err.message || 'Failed to submit promotion request', err.statusCode || 500);
    }
};

// GET /api/promotions/mine — seller sees their own promotions
const getMyPromotions = async (req, res) => {
    try {
        const promotions = await promotionService.getMyPromotions(req.user.id);
        res.json({ promotions });
    } catch (err) {
        console.error('getMyPromotions error:', err.message);
        sendError(res, err.message || 'Failed to fetch your promotions', err.statusCode || 500);
    }
};

// ─── ADMIN ─────────────────────────────────────────────────────────────────────

// GET /api/promotions/admin — admin lists all promotions
const adminListPromotions = async (req, res) => {
    try {
        const promotions = await promotionService.adminListPromotions(req.query.status);
        res.json({ promotions });
    } catch (err) {
        console.error('adminListPromotions error:', err.message);
        sendError(res, err.message || 'Failed to fetch promotions', err.statusCode || 500);
    }
};

// PATCH /api/promotions/:id/status — admin approves or rejects
const adminUpdatePromotionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        await promotionService.adminUpdatePromotionStatus(id, {
            status,
            admin_note
        });

        res.json({ message: `Promotion ${status === 'Active' ? 'activated' : 'rejected'} successfully.` });
    } catch (err) {
        console.error('adminUpdatePromotionStatus error:', err.message);
        sendError(res, err.message || 'Failed to update promotion status', err.statusCode || 500);
    }
};

module.exports = {
    getPlans,
    requestPromotion,
    getMyPromotions,
    adminListPromotions,
    adminUpdatePromotionStatus,
};

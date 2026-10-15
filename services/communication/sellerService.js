const db = require('../../config/db');

class SellerService {
    /**
     * Add or update a seller review
     */
    async addReview({ sellerId, reviewerId, rating, reviewText }) {
        if (!rating || rating < 1 || rating > 5) {
            const err = new Error('Valid rating (1-5) is required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            `INSERT INTO seller_reviews (seller_id, reviewer_id, rating, review_text)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (seller_id, reviewer_id) DO UPDATE
             SET rating = EXCLUDED.rating,
                 review_text = EXCLUDED.review_text,
                 created_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [sellerId, reviewerId, rating, reviewText]
        );
        return result.rows[0];
    }

    /**
     * Get reviews for a specific seller
     */
    async getReviews(sellerId) {
        const result = await db.query(
            `SELECT r.*, u.email as reviewer_email 
             FROM seller_reviews r
             JOIN users u ON r.reviewer_id = u.id
             WHERE r.seller_id = $1
             ORDER BY r.created_at DESC`,
            [sellerId]
        );
        return result.rows;
    }

    /**
     * Get trust profile (KYC status and average rating)
     */
    async getTrustProfile(sellerId) {
        // Fetch average rating
        const ratingRes = await db.query(
            `SELECT AVG(rating) as average_rating, COUNT(id) as total_reviews
             FROM seller_reviews WHERE seller_id = $1`,
            [sellerId]
        );

        // Fetch KYC status
        const kycRes = await db.query(
            `SELECT status FROM kyc_documents WHERE user_id = $1 ORDER BY submitted_at DESC LIMIT 1`,
            [sellerId]
        );

        const isVerified = kycRes.rows.length > 0 && kycRes.rows[0].status === 'Approved';
        const ratingData = ratingRes.rows[0];

        return {
            seller_id: sellerId,
            average_rating: ratingData.average_rating ? parseFloat(ratingData.average_rating).toFixed(1) : 0,
            total_reviews: parseInt(ratingData.total_reviews, 10),
            verified_badge: isVerified
        };
    }

    /**
     * Aggregates views, clicks, inquiries, and sponsored banner analytics for a seller
     */
    async getSellerAnalytics(sellerId) {
        // 1. Total product metrics
        const productStatsRes = await db.query(
            `SELECT 
                COUNT(ep.id) as total_products,
                COALESCE(SUM(em.view_count), 0) as total_views,
                COALESCE(SUM(em.click_count), 0) as total_clicks,
                COALESCE(SUM(em.inquiry_count), 0) as total_inquiries
             FROM equipment_posts ep
             LEFT JOIN engagement_metrics em ON em.equipment_post_id = ep.id
             WHERE ep.seller_id = $1 AND ep.status != 'Archived'`,
            [sellerId]
        );

        // 2. Sponsored banner metrics (hero_banners belonging to this seller or their equipment)
        const bannerStatsRes = await db.query(
            `SELECT 
                COUNT(hb.id) as total_banners,
                COALESCE(SUM(hb.views_count), 0) as total_banner_views,
                COALESCE(SUM(hb.clicks_count), 0) as total_banner_clicks
             FROM hero_banners hb
             WHERE (hb.seller_id = $1 OR hb.equipment_post_id IN (SELECT id FROM equipment_posts WHERE seller_id = $1))`,
            [sellerId]
        );

        // 3. Detailed sponsored banners list for this seller
        const bannersListRes = await db.query(
            `SELECT 
                hb.id, hb.title, hb.subtitle, hb.badge_text, hb.image_url, hb.link_url, 
                hb.button_text, hb.display_order, hb.is_active, hb.created_at,
                COALESCE(hb.views_count, 0) as views_count,
                COALESCE(hb.clicks_count, 0) as clicks_count,
                CASE 
                    WHEN COALESCE(hb.views_count, 0) > 0 
                    THEN ROUND((COALESCE(hb.clicks_count, 0)::numeric / hb.views_count::numeric) * 100, 2)
                    ELSE 0 
                END as ctr,
                ep.id as equipment_id,
                ep.title as equipment_title,
                ep.category as equipment_category,
                ep.price as equipment_price
             FROM hero_banners hb
             LEFT JOIN equipment_posts ep ON hb.equipment_post_id = ep.id
             WHERE (hb.seller_id = $1 OR hb.equipment_post_id IN (SELECT id FROM equipment_posts WHERE seller_id = $1))
             ORDER BY hb.created_at DESC`,
            [sellerId]
        );

        // 4. Products performance breakdown (with views, clicks, CTR)
        const productsListRes = await db.query(
            `SELECT 
                ep.id, ep.title, ep.category, ep.brand, ep.price, ep.status, ep.created_at,
                (SELECT image_url FROM equipment_images WHERE equipment_post_id = ep.id AND media_type = 'image' ORDER BY display_order ASC LIMIT 1) as thumbnail,
                COALESCE(em.view_count, 0) as views_count,
                COALESCE(em.click_count, 0) as clicks_count,
                COALESCE(em.inquiry_count, 0) as inquiries_count,
                CASE 
                    WHEN COALESCE(em.view_count, 0) > 0 
                    THEN ROUND((COALESCE(em.click_count, 0)::numeric / em.view_count::numeric) * 100, 2)
                    ELSE 0 
                END as ctr,
                CASE WHEN promo.id IS NOT NULL THEN true ELSE false END as is_sponsored
             FROM equipment_posts ep
             LEFT JOIN engagement_metrics em ON em.equipment_post_id = ep.id
             LEFT JOIN (
                 SELECT DISTINCT equipment_post_id, id FROM promotions WHERE status = 'Active' AND expires_at > NOW()
             ) promo ON promo.equipment_post_id = ep.id
             WHERE ep.seller_id = $1 AND ep.status != 'Archived'
             ORDER BY COALESCE(em.view_count, 0) DESC, ep.created_at DESC`,
            [sellerId]
        );

        const pStats = productStatsRes.rows[0];
        const bStats = bannerStatsRes.rows[0];

        const totalViews = parseInt(pStats.total_views, 10);
        const totalClicks = parseInt(pStats.total_clicks, 10);
        const totalBannerViews = parseInt(bStats.total_banner_views, 10);
        const totalBannerClicks = parseInt(bStats.total_banner_clicks, 10);

        const productCtr = totalViews > 0 ? parseFloat(((totalClicks / totalViews) * 100).toFixed(2)) : 0;
        const bannerCtr = totalBannerViews > 0 ? parseFloat(((totalBannerClicks / totalBannerViews) * 100).toFixed(2)) : 0;

        return {
            summary: {
                totalProducts: parseInt(pStats.total_products, 10),
                totalViews,
                totalClicks,
                totalInquiries: parseInt(pStats.total_inquiries, 10),
                productCtr,
                totalBanners: parseInt(bStats.total_banners, 10),
                totalBannerViews,
                totalBannerClicks,
                bannerCtr
            },
            sponsoredBanners: bannersListRes.rows,
            products: productsListRes.rows
        };
    }
}

module.exports = new SellerService();

const db = require('../../config/db');
const fs = require('fs');
const path = require('path');

class BannerService {
    /**
     * Fetch active hero carousel banners for homepage
     */
    async getActiveBanners() {
        const result = await db.query(
            `SELECT id, title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active, 
                    COALESCE(views_count, 0) as views_count, COALESCE(clicks_count, 0) as clicks_count,
                    seller_id, equipment_post_id, promotion_id, created_at 
             FROM hero_banners 
             WHERE is_active = true 
             ORDER BY display_order ASC, id ASC`
        );
        return result.rows;
    }

    /**
     * Fetch all banners for Admin management panel
     */
    async getAllBanners() {
        const result = await db.query(
            `SELECT id, title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active, 
                    COALESCE(views_count, 0) as views_count, COALESCE(clicks_count, 0) as clicks_count,
                    seller_id, equipment_post_id, promotion_id, created_at, updated_at 
             FROM hero_banners 
             ORDER BY display_order ASC, id ASC`
        );
        return result.rows;
    }

    /**
     * Create a new hero banner
     */
    async createBanner({ title, subtitle = '', badge_text = 'Featured Equipment', image_url, link_url = '/search', button_text = 'Explore Now', display_order = 0, is_active = true, seller_id = null, equipment_post_id = null }) {
        if (!title || !image_url) {
            const err = new Error('Title and image are required');
            err.statusCode = 400;
            throw err;
        }

        const order = parseInt(display_order, 10);
        const active = is_active === undefined || is_active === 'true' || is_active === true;

        // Auto-resolve equipment_post_id from link_url if formatted as /equipment/:uuid
        let resolvedEquipmentId = equipment_post_id;
        let resolvedSellerId = seller_id;

        if (!resolvedEquipmentId && link_url) {
            const match = link_url.match(/\/equipment\/([a-f0-9\-]{36})/i);
            if (match && match[1]) {
                resolvedEquipmentId = match[1];
                const eqCheck = await db.query('SELECT seller_id FROM equipment_posts WHERE id = $1', [resolvedEquipmentId]);
                if (eqCheck.rows.length > 0) {
                    resolvedSellerId = eqCheck.rows[0].seller_id;
                }
            }
        }

        const result = await db.query(
            `INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active, seller_id, equipment_post_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                title.trim(),
                subtitle ? subtitle.trim() : '',
                badge_text ? badge_text.trim() : 'Featured Equipment',
                image_url.trim(),
                link_url ? link_url.trim() : '/search',
                button_text ? button_text.trim() : 'Explore Now',
                isNaN(order) ? 0 : order,
                active,
                resolvedSellerId,
                resolvedEquipmentId
            ]
        );

        return result.rows[0];
    }

    /**
     * Update an existing banner
     */
    async updateBanner(id, fields) {
        const existing = await db.query('SELECT * FROM hero_banners WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            const err = new Error('Banner not found');
            err.statusCode = 404;
            throw err;
        }

        const oldBanner = existing.rows[0];
        let finalImageUrl = oldBanner.image_url;

        if (fields.file) {
            finalImageUrl = `/uploads/${fields.file.filename}`;
            if (oldBanner.image_url && oldBanner.image_url.startsWith('/uploads/')) {
                const fullOldPath = path.join(__dirname, '../public', oldBanner.image_url);
                if (fs.existsSync(fullOldPath)) {
                    try { fs.unlinkSync(fullOldPath); } catch (e) { /* ignore */ }
                }
            }
        } else if (fields.image_url && fields.image_url.trim()) {
            finalImageUrl = fields.image_url.trim();
        }

        const newTitle = fields.title !== undefined ? fields.title.trim() : oldBanner.title;
        const newSubtitle = fields.subtitle !== undefined ? fields.subtitle.trim() : oldBanner.subtitle;
        const newBadge = fields.badge_text !== undefined ? fields.badge_text.trim() : oldBanner.badge_text;
        const newLink = fields.link_url !== undefined ? fields.link_url.trim() : oldBanner.link_url;
        const newButton = fields.button_text !== undefined ? fields.button_text.trim() : oldBanner.button_text;
        const newOrder = fields.display_order !== undefined ? parseInt(fields.display_order, 10) : oldBanner.display_order;
        const newActive = fields.is_active !== undefined ? (fields.is_active === 'true' || fields.is_active === true) : oldBanner.is_active;

        const result = await db.query(
            `UPDATE hero_banners 
             SET title = $1, subtitle = $2, badge_text = $3, image_url = $4, link_url = $5, 
                 button_text = $6, display_order = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [newTitle, newSubtitle, newBadge, finalImageUrl, newLink, newButton, isNaN(newOrder) ? 0 : newOrder, newActive, id]
        );

        return result.rows[0];
    }

    /**
     * Delete banner
     */
    async deleteBanner(id) {
        const existing = await db.query('SELECT * FROM hero_banners WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            const err = new Error('Banner not found');
            err.statusCode = 404;
            throw err;
        }

        const oldPath = existing.rows[0].image_url;
        if (oldPath && oldPath.startsWith('/uploads/')) {
            const fullOldPath = path.join(__dirname, '../public', oldPath);
            if (fs.existsSync(fullOldPath)) {
                try { fs.unlinkSync(fullOldPath); } catch (e) { /* ignore */ }
            }
        }

        await db.query('DELETE FROM hero_banners WHERE id = $1', [id]);
        return true;
    }

    /**
     * Reorder banners
     */
    async reorderBanners(bannerIds) {
        if (!Array.isArray(bannerIds)) {
            const err = new Error('bannerIds must be an array');
            err.statusCode = 400;
            throw err;
        }

        for (let i = 0; i < bannerIds.length; i++) {
            await db.query('UPDATE hero_banners SET display_order = $1 WHERE id = $2', [i + 1, bannerIds[i]]);
        }
        return true;
    }

    /**
     * Track Banner Impression/View
     */
    async trackBannerView(id) {
        const result = await db.query(
            `UPDATE hero_banners
             SET views_count = COALESCE(views_count, 0) + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, views_count, promotion_id, equipment_post_id`,
            [id]
        );

        if (result.rows.length === 0) {
            const err = new Error('Banner not found');
            err.statusCode = 404;
            throw err;
        }

        const banner = result.rows[0];
        if (banner.promotion_id) {
            await db.query(
                `UPDATE promotions SET views_count = COALESCE(views_count, 0) + 1 WHERE id = $1`,
                [banner.promotion_id]
            );
        }

        return banner;
    }

    /**
     * Track Banner Click
     */
    async trackBannerClick(id) {
        const result = await db.query(
            `UPDATE hero_banners
             SET clicks_count = COALESCE(clicks_count, 0) + 1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, clicks_count, promotion_id, equipment_post_id`,
            [id]
        );

        if (result.rows.length === 0) {
            const err = new Error('Banner not found');
            err.statusCode = 404;
            throw err;
        }

        const banner = result.rows[0];
        if (banner.promotion_id) {
            await db.query(
                `UPDATE promotions SET clicks_count = COALESCE(clicks_count, 0) + 1 WHERE id = $1`,
                [banner.promotion_id]
            );
        }

        if (banner.equipment_post_id) {
            await db.query(
                `INSERT INTO engagement_metrics (equipment_post_id, click_count)
                 VALUES ($1, 1)
                 ON CONFLICT (equipment_post_id)
                 DO UPDATE SET click_count = COALESCE(engagement_metrics.click_count, 0) + 1, updated_at = CURRENT_TIMESTAMP`,
                [banner.equipment_post_id]
            );
            await db.query(
                `INSERT INTO analytics_events (event_type, equipment_post_id, metadata) VALUES ('banner_click', $1, $2)`,
                [banner.equipment_post_id, JSON.stringify({ banner_id: id })]
            );
        }

        return banner;
    }
}

module.exports = new BannerService();

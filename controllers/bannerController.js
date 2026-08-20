const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// 1. Get active banners for public landing page
const getActiveBanners = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active, created_at 
             FROM hero_banners 
             WHERE is_active = true 
             ORDER BY display_order ASC, id ASC`
        );
        res.json({ banners: result.rows });
    } catch (error) {
        console.error('Error fetching active banners:', error);
        res.status(500).json({ error: 'Failed to fetch hero banners' });
    }
};

// 2. Get all banners for Admin panel
const getAllBanners = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active, created_at, updated_at 
             FROM hero_banners 
             ORDER BY display_order ASC, id ASC`
        );
        res.json({ banners: result.rows });
    } catch (error) {
        console.error('Error fetching all banners:', error);
        res.status(500).json({ error: 'Failed to fetch banners' });
    }
};

// 3. Create new banner (Admin)
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, badge_text, link_url, button_text, display_order, is_active } = req.body;
        
        let imageUrl = req.body.image_url;
        if (req.file) {
            imageUrl = `/uploads/${req.file.filename}`;
        }

        if (!title || !imageUrl) {
            return res.status(400).json({ error: 'Title and image are required' });
        }

        const order = display_order ? parseInt(display_order, 10) : 0;
        const active = is_active === undefined || is_active === 'true' || is_active === true;

        const result = await db.query(
            `INSERT INTO hero_banners (title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                title.trim(),
                subtitle ? subtitle.trim() : '',
                badge_text ? badge_text.trim() : 'Featured Equipment',
                imageUrl.trim(),
                link_url ? link_url.trim() : '/search',
                button_text ? button_text.trim() : 'Explore Now',
                isNaN(order) ? 0 : order,
                active
            ]
        );

        res.status(201).json({ 
            message: 'Hero banner created successfully', 
            banner: result.rows[0] 
        });
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
};

// 4. Update banner (Admin)
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, badge_text, image_url, link_url, button_text, display_order, is_active } = req.body;

        const existing = await db.query('SELECT * FROM hero_banners WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        let finalImageUrl = existing.rows[0].image_url;
        if (req.file) {
            finalImageUrl = `/uploads/${req.file.filename}`;
            // If old image was local, optionally cleanup
            const oldPath = existing.rows[0].image_url;
            if (oldPath && oldPath.startsWith('/uploads/')) {
                const fullOldPath = path.join(__dirname, '../public', oldPath);
                if (fs.existsSync(fullOldPath)) {
                    try { fs.unlinkSync(fullOldPath); } catch (e) { /* ignore */ }
                }
            }
        } else if (image_url && image_url.trim()) {
            finalImageUrl = image_url.trim();
        }

        const newTitle = title !== undefined ? title.trim() : existing.rows[0].title;
        const newSubtitle = subtitle !== undefined ? subtitle.trim() : existing.rows[0].subtitle;
        const newBadge = badge_text !== undefined ? badge_text.trim() : existing.rows[0].badge_text;
        const newLink = link_url !== undefined ? link_url.trim() : existing.rows[0].link_url;
        const newButton = button_text !== undefined ? button_text.trim() : existing.rows[0].button_text;
        const newOrder = display_order !== undefined ? parseInt(display_order, 10) : existing.rows[0].display_order;
        const newActive = is_active !== undefined ? (is_active === 'true' || is_active === true) : existing.rows[0].is_active;

        const result = await db.query(
            `UPDATE hero_banners 
             SET title = $1, subtitle = $2, badge_text = $3, image_url = $4, link_url = $5, 
                 button_text = $6, display_order = $7, is_active = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING *`,
            [newTitle, newSubtitle, newBadge, finalImageUrl, newLink, newButton, isNaN(newOrder) ? 0 : newOrder, newActive, id]
        );

        res.json({ 
            message: 'Banner updated successfully', 
            banner: result.rows[0] 
        });
    } catch (error) {
        console.error('Error updating banner:', error);
        res.status(500).json({ error: 'Failed to update banner' });
    }
};

// 5. Delete banner (Admin)
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await db.query('SELECT * FROM hero_banners WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        const oldPath = existing.rows[0].image_url;
        if (oldPath && oldPath.startsWith('/uploads/')) {
            const fullOldPath = path.join(__dirname, '../public', oldPath);
            if (fs.existsSync(fullOldPath)) {
                try { fs.unlinkSync(fullOldPath); } catch (e) { /* ignore */ }
            }
        }

        await db.query('DELETE FROM hero_banners WHERE id = $1', [id]);
        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        res.status(500).json({ error: 'Failed to delete banner' });
    }
};

// 6. Reorder banners (Admin)
const reorderBanners = async (req, res) => {
    try {
        const { bannerIds } = req.body;
        if (!Array.isArray(bannerIds)) {
            return res.status(400).json({ error: 'bannerIds must be an array' });
        }

        for (let i = 0; i < bannerIds.length; i++) {
            await db.query('UPDATE hero_banners SET display_order = $1 WHERE id = $2', [i + 1, bannerIds[i]]);
        }

        res.json({ message: 'Banners reordered successfully' });
    } catch (error) {
        console.error('Error reordering banners:', error);
        res.status(500).json({ error: 'Failed to reorder banners' });
    }
};

module.exports = {
    getActiveBanners,
    getAllBanners,
    createBanner,
    updateBanner,
    deleteBanner,
    reorderBanners
};

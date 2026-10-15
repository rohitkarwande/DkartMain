const db = require('../../config/db');
const fs = require('fs');
const csv = require('csv-parser');

const CATEGORIES = ['MRI', 'X-Ray', 'Cathlab', 'ECG', 'Ultrasound', 'Ventilator', 'CT Scan', 'Patient Monitor', 'Defibrillator', 'Laboratory Equipment', 'Surgical Equipment', 'Other'];
const CONDITIONS = ['Used', 'Refurbished', 'Spare'];
const STATUSES = ['Draft', 'Active', 'Sold', 'Archived'];

class EquipmentService {
    /**
     * Create equipment post with validation, images, and admin notifications
     */
    async createEquipment({ sellerId, data, files, io, userContact, userId }) {
        const { title, description, category, brand, model, manufacturingYear, condition, price, city, state, country } = data;

        // Validations
        if (!title || title.length < 5 || title.length > 150) {
            const err = new Error('Title must be between 5 and 150 characters');
            err.statusCode = 400;
            throw err;
        }
        if (description && description.length > 3000) {
            const err = new Error('Description max 3000 characters');
            err.statusCode = 400;
            throw err;
        }
        if (!category || !CATEGORIES.includes(category)) {
            const err = new Error('Invalid category');
            err.statusCode = 400;
            throw err;
        }
        if (!brand || !model || !city) {
            const err = new Error('Brand, model, and city are required');
            err.statusCode = 400;
            throw err;
        }
        if (!condition || !CONDITIONS.includes(condition)) {
            const err = new Error('Invalid condition');
            err.statusCode = 400;
            throw err;
        }
        if (price !== undefined && price < 0) {
            const err = new Error('Price cannot be negative');
            err.statusCode = 400;
            throw err;
        }
        if (manufacturingYear && manufacturingYear > new Date().getFullYear()) {
            const err = new Error('Manufacturing year cannot exceed current year');
            err.statusCode = 400;
            throw err;
        }

        // Auto Moderation
        let initialStatus = 'Active';
        if (!files || files.length === 0) {
            initialStatus = 'Draft';
        } else if (price === 0 || price > 100000000) {
            initialStatus = 'Draft';
        }

        // Insert Post
        const insertQuery = `
            INSERT INTO equipment_posts (
                seller_id, title, description, category, brand, model, 
                manufacturing_year, condition, price, city, state, country, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
        const values = [sellerId, title, description, category, brand, model, manufacturingYear || null, condition, price || null, city, state || null, country || null, initialStatus];
        const result = await db.query(insertQuery, values);
        const post = result.rows[0];

        // Handle Images
        let images = [];
        if (files && files.length > 0) {
            if (files.length > 10) {
                const err = new Error('Maximum 10 images allowed');
                err.statusCode = 400;
                throw err;
            }

            const imagePromises = files.map((file, index) => {
                const isVideo = file.mimetype.startsWith('video/');
                const imageUrl = isVideo ? `/uploads/videos/${file.filename}` : `/uploads/${file.filename}`;
                const mediaType = isVideo ? 'video' : 'image';
                return db.query(
                    `INSERT INTO equipment_images (equipment_post_id, image_url, display_order, media_type) VALUES ($1, $2, $3, $4) RETURNING *`,
                    [post.id, imageUrl, index, mediaType]
                );
            });
            const imgResults = await Promise.all(imagePromises);
            images = imgResults.map(r => r.rows[0]);
        }

        // Notify Admins
        try {
            const { notifyAdmins } = require('../notifications/adminNotificationService');
            notifyAdmins(io, 'NEW_LISTING', `A new equipment listing was created: ${title}`, post.id);

            const { emailNewEquipmentListing } = require('../notifications/emailService');
            emailNewEquipmentListing(userContact, userId, title, post.id);
        } catch (notifErr) {
            console.error('Error sending new listing notifications:', notifErr.message);
        }

        return { message: 'Equipment post created successfully', post, images };
    }

    /**
     * Update equipment post
     */
    async updateEquipment({ id, sellerId, isAdmin, data, files }) {
        const { title, description, category, brand, model, manufacturingYear, condition, price, city, state, country, deletedImages } = data;

        const postResult = await db.query('SELECT * FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) {
            const err = new Error('Equipment post not found');
            err.statusCode = 404;
            throw err;
        }
        const post = postResult.rows[0];

        if (post.seller_id !== sellerId && !isAdmin) {
            const err = new Error('Unauthorized to update this post');
            err.statusCode = 403;
            throw err;
        }

        // Validations
        if (title && (title.length < 5 || title.length > 150)) {
            const err = new Error('Title must be between 5 and 150 characters');
            err.statusCode = 400;
            throw err;
        }
        if (description && description.length > 3000) {
            const err = new Error('Description max 3000 characters');
            err.statusCode = 400;
            throw err;
        }
        if (category && !CATEGORIES.includes(category)) {
            const err = new Error('Invalid category');
            err.statusCode = 400;
            throw err;
        }
        if (condition && !CONDITIONS.includes(condition)) {
            const err = new Error('Invalid condition');
            err.statusCode = 400;
            throw err;
        }
        if (price !== undefined && price < 0) {
            const err = new Error('Price cannot be negative');
            err.statusCode = 400;
            throw err;
        }
        if (manufacturingYear && manufacturingYear > new Date().getFullYear()) {
            const err = new Error('Manufacturing year cannot exceed current year');
            err.statusCode = 400;
            throw err;
        }

        // Update fields
        const updateQuery = `
            UPDATE equipment_posts SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                category = COALESCE($3, category),
                brand = COALESCE($4, brand),
                model = COALESCE($5, model),
                manufacturing_year = COALESCE($6, manufacturing_year),
                condition = COALESCE($7, condition),
                price = COALESCE($8, price),
                city = COALESCE($9, city),
                state = COALESCE($10, state),
                country = COALESCE($11, country),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *;
        `;
        const values = [title, description, category, brand, model, manufacturingYear, condition, price, city, state, country, id];
        const updatedPostResult = await db.query(updateQuery, values);

        // Handle image deletions
        if (deletedImages) {
            let imgIds = Array.isArray(deletedImages) ? deletedImages : [deletedImages];
            await db.query(`DELETE FROM equipment_images WHERE id = ANY($1::int[]) AND equipment_post_id = $2`, [imgIds, id]);
        }

        // Handle new image uploads
        if (files && files.length > 0) {
            const currentImgCountRes = await db.query('SELECT COUNT(*) FROM equipment_images WHERE equipment_post_id = $1', [id]);
            const currentCount = parseInt(currentImgCountRes.rows[0].count, 10);
            if (currentCount + files.length > 10) {
                const err = new Error('Adding these images would exceed the 10 image limit');
                err.statusCode = 400;
                throw err;
            }

            const imagePromises = files.map((file, index) => {
                const isVideo = file.mimetype.startsWith('video/');
                const imageUrl = isVideo ? `/uploads/videos/${file.filename}` : `/uploads/${file.filename}`;
                const mediaType = isVideo ? 'video' : 'image';
                return db.query(
                    `INSERT INTO equipment_images (equipment_post_id, image_url, display_order, media_type) VALUES ($1, $2, $3, $4) RETURNING *`,
                    [id, imageUrl, currentCount + index, mediaType]
                );
            });
            await Promise.all(imagePromises);
        }

        const remainingImages = await db.query('SELECT * FROM equipment_images WHERE equipment_post_id = $1 ORDER BY display_order', [id]);

        return { message: 'Equipment post updated successfully', post: updatedPostResult.rows[0], images: remainingImages.rows };
    }

    /**
     * Soft delete equipment post
     */
    async deleteEquipment({ id, sellerId, isAdmin }) {
        const postResult = await db.query('SELECT * FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) {
            const err = new Error('Equipment post not found');
            err.statusCode = 404;
            throw err;
        }

        if (postResult.rows[0].seller_id !== sellerId && !isAdmin) {
            const err = new Error('Unauthorized to delete this post');
            err.statusCode = 403;
            throw err;
        }

        await db.query(`UPDATE equipment_posts SET status = 'Archived', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
        return { message: 'Equipment post deleted (archived) successfully' };
    }

    /**
     * Get single equipment post details and increment views
     */
    async getSingleEquipment({ id, userId }) {
        const postQuery = `
            SELECT ep.*, u.email as seller_email, u.phone as seller_phone
            FROM equipment_posts ep
            JOIN users u ON ep.seller_id = u.id
            WHERE ep.id = $1 AND ep.status != 'Archived';
        `;
        const postResult = await db.query(postQuery, [id]);

        if (postResult.rows.length === 0) {
            const err = new Error('Equipment post not found');
            err.statusCode = 404;
            throw err;
        }

        // Increment view count
        await db.query(
            `INSERT INTO engagement_metrics (equipment_post_id, view_count)
             VALUES ($1, 1)
             ON CONFLICT (equipment_post_id)
             DO UPDATE SET view_count = engagement_metrics.view_count + 1, updated_at = CURRENT_TIMESTAMP`,
            [id]
        );

        // Track view analytics
        await db.query(`INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'view', $2)`, [userId || null, id]);

        const imagesResult = await db.query('SELECT * FROM equipment_images WHERE equipment_post_id = $1 ORDER BY display_order', [id]);

        return {
            post: postResult.rows[0],
            images: imagesResult.rows
        };
    }

    /**
     * List equipment with search, filters, pagination, and sorting
     */
    async listEquipment(params, userId) {
        const { category, condition, city, brand, minPrice, maxPrice, search, sort, page = 1, limit = 10 } = params;

        let queryStr = `SELECT ep.*, u.email as seller_email, 
            (SELECT json_agg(json_build_object('id', ei.id, 'image_url', ei.image_url, 'media_type', ei.media_type)) FROM equipment_images ei WHERE ei.equipment_post_id = ep.id) as images,
            CASE WHEN promo.id IS NOT NULL THEN true ELSE false END as is_sponsored
            FROM equipment_posts ep
            JOIN users u ON ep.seller_id = u.id
            LEFT JOIN promotions promo ON promo.equipment_post_id = ep.id
                AND promo.type = 'sponsored'
                AND promo.status = 'Active'
                AND promo.expires_at > NOW()
            WHERE ep.status IN ('Active', 'Sold')`;
        const queryParams = [];
        let paramIndex = 1;

        if (category) {
            queryStr += ` AND ep.category = $${paramIndex++}`;
            queryParams.push(category);
        }
        if (condition) {
            queryStr += ` AND ep.condition = $${paramIndex++}`;
            queryParams.push(condition);
        }
        if (city) {
            queryStr += ` AND ep.city ILIKE $${paramIndex++}`;
            queryParams.push(`%${city}%`);
        }
        if (brand) {
            queryStr += ` AND ep.brand ILIKE $${paramIndex++}`;
            queryParams.push(`%${brand}%`);
        }
        if (minPrice) {
            queryStr += ` AND ep.price >= $${paramIndex++}`;
            queryParams.push(minPrice);
        }
        if (maxPrice) {
            queryStr += ` AND ep.price <= $${paramIndex++}`;
            queryParams.push(maxPrice);
        }

        let isSearchActive = false;
        if (search) {
            isSearchActive = true;
            // Track search analytics
            await db.query(`INSERT INTO search_analytics (user_id, search_query) VALUES ($1, $2)`, [userId || null, search]);

            // Track popular tags
            const tags = search.split(/\s+/).filter(t => t.length > 2);
            for (const tag of tags) {
                await db.query(
                    `INSERT INTO popular_tags (tag, search_count)
                     VALUES ($1, 1)
                     ON CONFLICT (tag)
                     DO UPDATE SET search_count = popular_tags.search_count + 1, last_searched_at = CURRENT_TIMESTAMP`,
                    [tag.toLowerCase()]
                );
            }

            const searchTerms = search.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 0);
            const tsQueryStr = searchTerms.map(term => `${term}:*`).join(' & ');

            queryStr += ` AND ep.search_vector @@ to_tsquery('english', $${paramIndex})`;
            queryParams.push(tsQueryStr);
            paramIndex++;
        }

        const sponsoredSort = `CASE WHEN promo.id IS NOT NULL THEN 0 ELSE 1 END ASC`;
        if (sort === 'oldest') {
            queryStr += ` ORDER BY ${sponsoredSort}, ep.created_at ASC`;
        } else if (sort === 'price low to high') {
            queryStr += ` ORDER BY ${sponsoredSort}, ep.price ASC NULLS LAST`;
        } else if (sort === 'price high to low') {
            queryStr += ` ORDER BY ${sponsoredSort}, ep.price DESC NULLS LAST`;
        } else {
            if (isSearchActive) {
                queryStr += ` ORDER BY ${sponsoredSort}, ts_rank(ep.search_vector, to_tsquery('english', $${paramIndex - 1})) DESC, ep.created_at DESC`;
            } else {
                queryStr += ` ORDER BY ${sponsoredSort}, ep.created_at DESC`;
            }
        }

        const offset = (page - 1) * limit;
        queryStr += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limit, offset);

        const result = await db.query(queryStr, queryParams);

        // Count total
        let countQuery = `SELECT COUNT(*) FROM equipment_posts ep WHERE ep.status IN ('Active', 'Sold')`;
        const countParams = [];
        let countIndex = 1;
        if (category) { countQuery += ` AND ep.category = $${countIndex++}`; countParams.push(category); }
        if (condition) { countQuery += ` AND ep.condition = $${countIndex++}`; countParams.push(condition); }
        if (city) { countQuery += ` AND ep.city ILIKE $${countIndex++}`; countParams.push(`%${city}%`); }
        if (brand) { countQuery += ` AND ep.brand ILIKE $${countIndex++}`; countParams.push(`%${brand}%`); }
        if (minPrice) { countQuery += ` AND ep.price >= $${countIndex++}`; countParams.push(minPrice); }
        if (maxPrice) { countQuery += ` AND ep.price <= $${countIndex++}`; countParams.push(maxPrice); }
        if (search) {
            const searchTerms = search.trim().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(t => t.length > 0);
            const tsQueryStr = searchTerms.map(term => `${term}:*`).join(' & ');
            countQuery += ` AND ep.search_vector @@ to_tsquery('english', $${countIndex})`;
            countParams.push(tsQueryStr);
            countIndex++;
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count, 10);

        return {
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page, 10),
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get seller's own equipment posts with metrics and banners
     */
    async getMyEquipment({ sellerId, page = 1, limit = 10, sort = 'latest' }) {
        let queryStr = `SELECT ep.*, 
            (SELECT json_agg(json_build_object('id', ei.id, 'image_url', ei.image_url, 'media_type', ei.media_type)) FROM equipment_images ei WHERE ei.equipment_post_id = ep.id) as images,
            COALESCE(em.view_count, 0) as views_count,
            COALESCE(em.click_count, 0) as clicks_count,
            COALESCE(em.inquiry_count, 0) as inquiries_count,
            COALESCE(hb.total_banner_views, 0) as banner_views_count,
            COALESCE(hb.total_banner_clicks, 0) as banner_clicks_count,
            CASE WHEN hb.total_banner_views IS NOT NULL THEN true ELSE false END as has_active_banner,
            CASE WHEN promo.id IS NOT NULL THEN true ELSE false END as is_sponsored
            FROM equipment_posts ep
            LEFT JOIN engagement_metrics em ON em.equipment_post_id = ep.id
            LEFT JOIN (
                SELECT equipment_post_id, 
                       SUM(COALESCE(views_count, 0)) as total_banner_views, 
                       SUM(COALESCE(clicks_count, 0)) as total_banner_clicks
                FROM hero_banners
                WHERE equipment_post_id IS NOT NULL
                GROUP BY equipment_post_id
            ) hb ON hb.equipment_post_id = ep.id
            LEFT JOIN (
                SELECT DISTINCT equipment_post_id, id 
                FROM promotions 
                WHERE status = 'Active' AND expires_at > NOW()
            ) promo ON promo.equipment_post_id = ep.id
            WHERE ep.seller_id = $1`;

        if (sort === 'oldest') queryStr += ` ORDER BY ep.created_at ASC`;
        else queryStr += ` ORDER BY ep.created_at DESC`;

        const offset = (page - 1) * limit;
        queryStr += ` LIMIT $2 OFFSET $3`;

        const result = await db.query(queryStr, [sellerId, limit, offset]);

        const countResult = await db.query(`SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1`, [sellerId]);
        const total = parseInt(countResult.rows[0].count, 10);

        return {
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page, 10),
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Update equipment status (Draft, Active, Sold, Archived)
     */
    async updateStatus({ id, status, sellerId, isAdmin }) {
        if (!status || !STATUSES.includes(status)) {
            const err = new Error('Invalid status value');
            err.statusCode = 400;
            throw err;
        }

        const postResult = await db.query('SELECT * FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) {
            const err = new Error('Equipment post not found');
            err.statusCode = 404;
            throw err;
        }

        if (postResult.rows[0].seller_id !== sellerId && !isAdmin) {
            const err = new Error('Unauthorized to change status of this post');
            err.statusCode = 403;
            throw err;
        }

        const updated = await db.query(
            `UPDATE equipment_posts SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, id]
        );

        return { message: 'Status updated successfully', post: updated.rows[0] };
    }

    /**
     * Get similar equipment listings
     */
    async getSimilarListings(id) {
        const postResult = await db.query('SELECT category, brand, condition FROM equipment_posts WHERE id = $1', [id]);
        if (postResult.rows.length === 0) {
            const err = new Error('Equipment post not found');
            err.statusCode = 404;
            throw err;
        }

        const { category, brand, condition } = postResult.rows[0];

        const queryStr = `
            SELECT ep.*, 
            (SELECT json_agg(json_build_object('id', ei.id, 'image_url', ei.image_url)) FROM equipment_images ei WHERE ei.equipment_post_id = ep.id) as images
            FROM equipment_posts ep
            WHERE ep.status IN ('Active', 'Sold') AND ep.id != $1 AND ep.category = $2
            ORDER BY 
                CASE WHEN ep.brand = $3 THEN 1 ELSE 0 END DESC,
                CASE WHEN ep.condition = $4 THEN 1 ELSE 0 END DESC,
                ep.created_at DESC
            LIMIT 5;
        `;
        const result = await db.query(queryStr, [id, category, brand, condition]);
        return result.rows;
    }

    /**
     * Get popular search tags
     */
    async getPopularTags() {
        const result = await db.query('SELECT tag, search_count FROM popular_tags ORDER BY search_count DESC LIMIT 20');
        return result.rows;
    }

    /**
     * Get engagement metrics for a post
     */
    async getEngagementMetrics(id) {
        const result = await db.query('SELECT view_count, save_count, inquiry_count FROM engagement_metrics WHERE equipment_post_id = $1', [id]);
        return result.rows[0] || { view_count: 0, save_count: 0, inquiry_count: 0 };
    }

    /**
     * Bulk upload equipment posts from CSV file
     */
    async bulkUploadEquipment({ sellerId, filePath }) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    let successCount = 0;
                    let failCount = 0;
                    const errors = [];

                    for (let i = 0; i < results.length; i++) {
                        const row = results[i];
                        try {
                            const title = row.title || row.Title;
                            const category = row.category || row.Category;
                            const brand = row.brand || row.Brand;
                            const model = row.model || row.Model;
                            const condition = row.condition || row.Condition;
                            const price = row.price || row.Price || null;
                            const city = row.city || row.City;
                            const state = row.state || row.State || null;
                            const description = row.description || row.Description || '';
                            const year = row.manufacturing_year || row.Manufacturing_Year || null;

                            if (!title || !category || !brand || !model || !condition || !city) {
                                failCount++;
                                errors.push(`Row ${i + 2}: Missing required fields (title, category, brand, model, condition, city)`);
                                continue;
                            }

                            if (!CATEGORIES.includes(category) || !CONDITIONS.includes(condition)) {
                                failCount++;
                                errors.push(`Row ${i + 2}: Invalid category or condition`);
                                continue;
                            }

                            const insertQuery = `
                                INSERT INTO equipment_posts (
                                    seller_id, title, description, category, brand, model, 
                                    manufacturing_year, condition, price, city, state, status
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Draft')
                            `;
                            const values = [sellerId, title, description, category, brand, model, year, condition, price, city, state];
                            await db.query(insertQuery, values);
                            successCount++;
                        } catch (err) {
                            failCount++;
                            errors.push(`Row ${i + 2}: Database error - ${err.message}`);
                        }
                    }

                    try {
                        fs.unlinkSync(filePath);
                    } catch (unlinkErr) {
                        console.error('Failed to unlink bulk upload file:', unlinkErr.message);
                    }

                    resolve({
                        message: 'Bulk upload completed',
                        successCount,
                        failCount,
                        errors
                    });
                })
                .on('error', (err) => {
                    try {
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    } catch (e) {}
                    reject(err);
                });
        });
    }

    /**
     * Record click on equipment post
     */
    async trackEquipmentClick({ id, userId }) {
        const postCheck = await db.query('SELECT id FROM equipment_posts WHERE id = $1', [id]);
        if (postCheck.rows.length === 0) {
            const err = new Error('Equipment post not found');
            err.statusCode = 404;
            throw err;
        }

        await db.query(
            `INSERT INTO engagement_metrics (equipment_post_id, click_count)
             VALUES ($1, 1)
             ON CONFLICT (equipment_post_id)
             DO UPDATE SET click_count = COALESCE(engagement_metrics.click_count, 0) + 1, updated_at = CURRENT_TIMESTAMP`,
            [id]
        );

        await db.query(
            `INSERT INTO analytics_events (user_id, event_type, equipment_post_id) VALUES ($1, 'click', $2)`,
            [userId || null, id]
        );

        return { success: true, message: 'Click recorded' };
    }
}

module.exports = new EquipmentService();

const db = require('../../config/db');
const fs = require('fs');
const csv = require('csv-parser');

class VendorService {
    /**
     * Get vendor dashboard metrics (listings, active, closed deals, inquiries)
     */
    async getDashboardMetrics(vendorId) {
        const totalListings = await db.query("SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1", [vendorId]);
        const activeListings = await db.query("SELECT COUNT(*) FROM equipment_posts WHERE seller_id = $1 AND status = 'Active'", [vendorId]);
        const closedDeals = await db.query("SELECT COUNT(*) FROM inquiries WHERE seller_id = $1 AND status = 'Deal Closed'", [vendorId]);
        const inquiryCount = await db.query("SELECT COUNT(*) FROM inquiries WHERE seller_id = $1", [vendorId]);

        return {
            total_listings: parseInt(totalListings.rows[0].count, 10),
            active_listings: parseInt(activeListings.rows[0].count, 10),
            closed_deals: parseInt(closedDeals.rows[0].count, 10),
            inquiry_count: parseInt(inquiryCount.rows[0].count, 10)
        };
    }

    /**
     * Update stock and reserved inventory quantities
     */
    async updateInventory({ id, vendorId, stock_quantity, reserved_quantity }) {
        const result = await db.query(
            "UPDATE equipment_posts SET stock_quantity = COALESCE($1, stock_quantity), reserved_quantity = COALESCE($2, reserved_quantity), updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND seller_id = $4 RETURNING *",
            [stock_quantity, reserved_quantity, id, vendorId]
        );

        if (result.rows.length === 0) {
            const err = new Error('Equipment post not found or unauthorized');
            err.statusCode = 404;
            throw err;
        }

        return result.rows[0];
    }

    /**
     * Get all vendor locations
     */
    async getLocations(vendorId) {
        const result = await db.query("SELECT * FROM vendor_locations WHERE vendor_id = $1", [vendorId]);
        return result.rows;
    }

    /**
     * Add vendor location
     */
    async addLocation({ vendorId, data }) {
        const { branch_name, address, city, state, country, is_primary } = data;

        if (!branch_name) {
            const err = new Error('Branch name is required');
            err.statusCode = 400;
            throw err;
        }

        const result = await db.query(
            "INSERT INTO vendor_locations (vendor_id, branch_name, address, city, state, country, is_primary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
            [vendorId, branch_name, address, city, state, country, is_primary || false]
        );

        return result.rows[0];
    }

    /**
     * Update vendor location
     */
    async updateLocation({ id, vendorId, data }) {
        const { branch_name, address, city, state, country, is_primary } = data;

        const result = await db.query(
            "UPDATE vendor_locations SET branch_name = COALESCE($1, branch_name), address = COALESCE($2, address), city = COALESCE($3, city), state = COALESCE($4, state), country = COALESCE($5, country), is_primary = COALESCE($6, is_primary) WHERE id = $7 AND vendor_id = $8 RETURNING *",
            [branch_name, address, city, state, country, is_primary, id, vendorId]
        );

        if (result.rows.length === 0) {
            const err = new Error('Location not found or unauthorized');
            err.statusCode = 404;
            throw err;
        }

        return result.rows[0];
    }

    /**
     * Delete vendor location
     */
    async deleteLocation({ id, vendorId }) {
        const result = await db.query("DELETE FROM vendor_locations WHERE id = $1 AND vendor_id = $2 RETURNING *", [id, vendorId]);
        if (result.rows.length === 0) {
            const err = new Error('Location not found or unauthorized');
            err.statusCode = 404;
            throw err;
        }
        return { message: 'Location deleted' };
    }

    /**
     * Bulk CSV upload for vendor listings
     */
    async bulkUploadListings({ vendorId, filePath }) {
        return new Promise((resolve, reject) => {
            const results = [];
            const errors = [];
            let rowCount = 0;

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    const inserted = [];
                    for (const row of results) {
                        rowCount++;
                        try {
                            const { title, description, category, brand, model, manufacturing_year, condition, price, city, state, country, stock_quantity } = row;

                            if (!title || !category || !brand || !model || !condition || !city) {
                                errors.push({ row: rowCount, error: 'Missing required fields' });
                                continue;
                            }

                            const result = await db.query(`
                                INSERT INTO equipment_posts (
                                    seller_id, title, description, category, brand, model, 
                                    manufacturing_year, condition, price, city, state, country, status, stock_quantity
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Active', $13)
                                RETURNING *
                            `, [
                                vendorId, title, description, category, brand, model,
                                manufacturing_year ? parseInt(manufacturing_year, 10) : null,
                                condition,
                                price ? parseFloat(price) : null,
                                city, state, country,
                                stock_quantity ? parseInt(stock_quantity, 10) : 1
                            ]);

                            inserted.push(result.rows[0]);
                        } catch (err) {
                            errors.push({ row: rowCount, error: err.message });
                        }
                    }

                    try {
                        fs.unlinkSync(filePath);
                    } catch (unlinkErr) {
                        console.error('Failed to unlink CSV:', unlinkErr.message);
                    }

                    resolve({
                        message: 'Bulk upload completed',
                        totalProcessed: rowCount,
                        successCount: inserted.length,
                        errorCount: errors.length,
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
}

module.exports = new VendorService();

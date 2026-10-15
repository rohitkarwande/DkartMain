const equipmentService = require('../services/equipment/equipmentService');

const sendError = (res, message, status = 400) => res.status(status).json({ error: message });

// 5. Create Equipment Post
const createEquipment = async (req, res) => {
    try {
        const result = await equipmentService.createEquipment({
            sellerId: req.user.id,
            data: req.body,
            files: req.files,
            io: req.io,
            userContact: req.user?.email || req.user?.phone,
            userId: req.user?.id
        });
        res.status(201).json(result);
    } catch (error) {
        console.error('Error in createEquipment:', error);
        sendError(res, error.message || 'Server error while creating equipment post', error.statusCode || 500);
    }
};

// 6. Update Equipment Post
const updateEquipment = async (req, res) => {
    try {
        const result = await equipmentService.updateEquipment({
            id: req.params.id,
            sellerId: req.user.id,
            isAdmin: req.user.role === 'admin',
            data: req.body,
            files: req.files
        });
        res.json(result);
    } catch (error) {
        console.error('Error in updateEquipment:', error);
        sendError(res, error.message || 'Server error while updating equipment post', error.statusCode || 500);
    }
};

// 7. Delete Equipment Post (Soft Delete)
const deleteEquipment = async (req, res) => {
    try {
        const result = await equipmentService.deleteEquipment({
            id: req.params.id,
            sellerId: req.user.id,
            isAdmin: req.user.role === 'admin'
        });
        res.json(result);
    } catch (error) {
        console.error('Error in deleteEquipment:', error);
        sendError(res, error.message || 'Server error while deleting equipment post', error.statusCode || 500);
    }
};

// 8. Get Single Equipment API
const getSingleEquipment = async (req, res) => {
    try {
        const result = await equipmentService.getSingleEquipment({
            id: req.params.id,
            userId: req.user ? req.user.id : null
        });
        res.json(result);
    } catch (error) {
        console.error('Error in getSingleEquipment:', error);
        sendError(res, error.message || 'Server error while fetching equipment post', error.statusCode || 500);
    }
};

// 9. List Equipment API (with filters, sort, pagination, search)
const listEquipment = async (req, res) => {
    try {
        const result = await equipmentService.listEquipment(
            req.query,
            req.user ? req.user.id : null
        );
        res.json(result);
    } catch (error) {
        console.error('Error in listEquipment:', error);
        sendError(res, error.message || 'Server error while fetching equipment posts', error.statusCode || 500);
    }
};

// 10. Seller Equipment API
const getMyEquipment = async (req, res) => {
    try {
        const result = await equipmentService.getMyEquipment({
            sellerId: req.user.id,
            page: req.query.page,
            limit: req.query.limit,
            sort: req.query.sort
        });
        res.json(result);
    } catch (error) {
        console.error('Error in getMyEquipment:', error);
        sendError(res, error.message || 'Server error while fetching your equipment posts', error.statusCode || 500);
    }
};

// 12. Update Status API
const updateStatus = async (req, res) => {
    try {
        const result = await equipmentService.updateStatus({
            id: req.params.id,
            status: req.body.status,
            sellerId: req.user.id,
            isAdmin: req.user.role === 'admin'
        });
        res.json(result);
    } catch (error) {
        console.error('Error in updateStatus:', error);
        sendError(res, error.message || 'Server error while updating status', error.statusCode || 500);
    }
};

// 13. Get Similar Listings
const getSimilarListings = async (req, res) => {
    try {
        const result = await equipmentService.getSimilarListings(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error in getSimilarListings:', error);
        sendError(res, error.message || 'Server error while fetching similar listings', error.statusCode || 500);
    }
};

// 14. Get Popular Tags
const getPopularTags = async (req, res) => {
    try {
        const result = await equipmentService.getPopularTags();
        res.json(result);
    } catch (error) {
        console.error('Error in getPopularTags:', error);
        sendError(res, error.message || 'Server error while fetching popular tags', error.statusCode || 500);
    }
};

// 15. Get Engagement Metrics for Post
const getEngagementMetrics = async (req, res) => {
    try {
        const result = await equipmentService.getEngagementMetrics(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error in getEngagementMetrics:', error);
        sendError(res, error.message || 'Server error while fetching engagement metrics', error.statusCode || 500);
    }
};

// 16. Bulk Upload Equipment API
const bulkUploadEquipment = async (req, res) => {
    try {
        if (!req.file) return sendError(res, 'No CSV file uploaded');

        const result = await equipmentService.bulkUploadEquipment({
            sellerId: req.user.id,
            filePath: req.file.path
        });
        res.json(result);
    } catch (error) {
        console.error('Error in bulkUploadEquipment:', error);
        sendError(res, error.message || 'Server error during bulk upload', error.statusCode || 500);
    }
};

// 17. Track Equipment Click
const trackEquipmentClick = async (req, res) => {
    try {
        const result = await equipmentService.trackEquipmentClick({
            id: req.params.id,
            userId: req.user ? req.user.id : null
        });
        res.json(result);
    } catch (error) {
        console.error('Error recording equipment click:', error);
        sendError(res, error.message || 'Server error while recording click', error.statusCode || 500);
    }
};

module.exports = {
    createEquipment,
    updateEquipment,
    deleteEquipment,
    getSingleEquipment,
    listEquipment,
    getMyEquipment,
    updateStatus,
    getSimilarListings,
    getPopularTags,
    getEngagementMetrics,
    bulkUploadEquipment,
    trackEquipmentClick
};

const vendorService = require('../services/equipment/vendorService');

// 1. Vendor Dashboard Metrics
const getDashboardMetrics = async (req, res) => {
    try {
        const metrics = await vendorService.getDashboardMetrics(req.user.id);
        res.json(metrics);
    } catch (error) {
        console.error('Error in getDashboardMetrics:', error);
        res.status(500).json({ error: 'Server Error fetching dashboard metrics' });
    }
};

// 2. Inventory Tracking (Updating stock)
const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_quantity, reserved_quantity } = req.body;
        const post = await vendorService.updateInventory({
            id,
            vendorId: req.user.id,
            stock_quantity,
            reserved_quantity
        });
        res.json({ message: 'Inventory updated', post });
    } catch (error) {
        console.error('Error in updateInventory:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error updating inventory' });
    }
};

// 3. Multi Location Support
const getLocations = async (req, res) => {
    try {
        const locations = await vendorService.getLocations(req.user.id);
        res.json(locations);
    } catch (error) {
        console.error('Error in getLocations:', error);
        res.status(500).json({ error: 'Server Error fetching locations' });
    }
};

const addLocation = async (req, res) => {
    try {
        const location = await vendorService.addLocation({
            vendorId: req.user.id,
            data: req.body
        });
        res.status(201).json({ message: 'Location added', location });
    } catch (error) {
        console.error('Error in addLocation:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error adding location' });
    }
};

const updateLocation = async (req, res) => {
    try {
        const location = await vendorService.updateLocation({
            id: req.params.id,
            vendorId: req.user.id,
            data: req.body
        });
        res.json({ message: 'Location updated', location });
    } catch (error) {
        console.error('Error in updateLocation:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error updating location' });
    }
};

const deleteLocation = async (req, res) => {
    try {
        const result = await vendorService.deleteLocation({
            id: req.params.id,
            vendorId: req.user.id
        });
        res.json(result);
    } catch (error) {
        console.error('Error in deleteLocation:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error deleting location' });
    }
};

// 4. Bulk CSV Upload
const bulkUploadListings = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'CSV file required' });

        const result = await vendorService.bulkUploadListings({
            vendorId: req.user.id,
            filePath: req.file.path
        });
        res.json(result);
    } catch (error) {
        console.error('Error in bulkUploadListings:', error);
        res.status(500).json({ error: 'Server Error during bulk upload' });
    }
};

module.exports = {
    getDashboardMetrics,
    updateInventory,
    getLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    bulkUploadListings
};

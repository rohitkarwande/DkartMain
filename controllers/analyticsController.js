const analyticsService = require('../services/marketing/analyticsService');

// 1. Demand Reports - Most Searched & Most Viewed
const getDemandReports = async (req, res) => {
    try {
        const reports = await analyticsService.getDemandReports();
        res.json(reports);
    } catch (error) {
        console.error('Error in getDemandReports:', error);
        res.status(500).json({ error: 'Server error fetching demand reports' });
    }
};

// 2. Geographic Analytics & Heatmap Data
const getGeographicAnalytics = async (req, res) => {
    try {
        const data = await analyticsService.getGeographicAnalytics();
        res.json(data);
    } catch (error) {
        console.error('Error in getGeographicAnalytics:', error);
        res.status(500).json({ error: 'Server error fetching geographic analytics' });
    }
};

// 3. Trending Equipment
const getTrendingEquipment = async (req, res) => {
    try {
        const trending = await analyticsService.getTrendingEquipment();
        res.json(trending);
    } catch (error) {
        console.error('Error in getTrendingEquipment:', error);
        res.status(500).json({ error: 'Server error fetching trending equipment' });
    }
};

// 5. Conversion Funnel Analytics
const getConversionFunnel = async (req, res) => {
    try {
        const funnel = await analyticsService.getConversionFunnel();
        res.json(funnel);
    } catch (error) {
        console.error('Error in getConversionFunnel:', error);
        res.status(500).json({ error: 'Server error fetching conversion funnel' });
    }
};

module.exports = {
    getDemandReports,
    getGeographicAnalytics,
    getTrendingEquipment,
    getConversionFunnel
};

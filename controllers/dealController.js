const dealService = require('../services/communication/dealService');

const getDealHistory = async (req, res) => {
    try {
        const deals = await dealService.getDealHistory(req.user.id);
        res.json(deals);
    } catch (error) {
        console.error('Error fetching deal history:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

const getMetrics = async (req, res) => {
    try {
        const metrics = await dealService.getMetrics(req.user.id);
        res.json(metrics);
    } catch (error) {
        console.error('Error fetching deal metrics:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = {
    getDealHistory,
    getMetrics
};

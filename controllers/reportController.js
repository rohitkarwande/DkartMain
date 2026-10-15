const reportService = require('../services/admin/reportService');

const reportFraud = async (req, res) => {
    try {
        const report = await reportService.reportFraud(req.user.id, req.body);
        res.status(201).json({ message: 'Report submitted successfully', report });
    } catch (error) {
        console.error('Error submitting report:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Error submitting report' });
    }
};

module.exports = {
    reportFraud
};

const legalService = require('../services/support/legalService');

// 1. Submit Legal Query
const submitLegalQuery = async (req, res) => {
    try {
        const query = await legalService.submitQuery(req.user.id, req.body);
        res.status(201).json({ message: 'Legal query submitted', query });
    } catch (error) {
        console.error('Error submitting legal query:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error submitting legal query' });
    }
};

// User Tracking (Get my queries)
const getMyLegalQueries = async (req, res) => {
    try {
        const queries = await legalService.getMyQueries(req.user.id);
        res.json(queries);
    } catch (error) {
        console.error('Error fetching legal queries:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error fetching legal queries' });
    }
};

// 2. Admin Panel
const getAllLegalQueries = async (req, res) => {
    try {
        const queries = await legalService.getAllQueries();
        res.json(queries);
    } catch (error) {
        console.error('Error fetching all legal queries:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error fetching all legal queries' });
    }
};

const updateLegalQueryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const query = await legalService.updateQueryStatus(id, status);
        res.json({ message: 'Legal query updated', query });
    } catch (error) {
        console.error('Error updating legal query:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error updating legal query' });
    }
};

module.exports = {
    submitLegalQuery,
    getMyLegalQueries,
    getAllLegalQueries,
    updateLegalQueryStatus
};

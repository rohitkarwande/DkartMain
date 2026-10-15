const inquiryService = require('../services/communication/inquiryService');

const createInquiry = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const buyerContact = req.user?.email || req.user?.phone;
        const { equipment_post_id } = req.body;

        const inquiry = await inquiryService.createInquiry(buyerId, buyerContact, equipment_post_id);
        res.status(201).json({ message: 'Inquiry created successfully', inquiry });
    } catch (error) {
        console.error('Error creating inquiry:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const getSellerInquiries = async (req, res) => {
    try {
        const inquiries = await inquiryService.getSellerInquiries(req.user.id);
        res.json(inquiries);
    } catch (error) {
        console.error('Error fetching seller inquiries:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const getBuyerInquiries = async (req, res) => {
    try {
        const inquiries = await inquiryService.getBuyerInquiries(req.user.id);
        res.json(inquiries);
    } catch (error) {
        console.error('Error fetching buyer inquiries:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const updated = await inquiryService.updateInquiryStatus(id, req.user.id, status, req.io);
        res.json({ message: 'Status updated successfully', inquiry: updated });
    } catch (error) {
        console.error('Error updating inquiry status:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const getInquiryById = async (req, res) => {
    try {
        const inquiry = await inquiryService.getInquiryById(req.params.id, req.user.id);
        res.json(inquiry);
    } catch (error) {
        console.error('Error fetching inquiry by id:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server Error' });
    }
};

const getAdminFunnelStats = async (req, res) => {
    try {
        const stats = await inquiryService.getAdminFunnelStats(req.query.period);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching admin funnel stats:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error fetching funnel stats' });
    }
};

module.exports = {
    createInquiry,
    getSellerInquiries,
    updateInquiryStatus,
    getBuyerInquiries,
    getInquiryById,
    getAdminFunnelStats,
};
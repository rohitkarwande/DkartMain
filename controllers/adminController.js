const adminService = require('../services/admin/adminService');

// 1. Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminService.getDashboardStats();
        res.json(stats);
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({ error: 'Server error fetching stats' });
    }
};

// 2. User Management
const getAllUsers = async (req, res) => {
    try {
        const users = await adminService.getAllUsers(req.query);
        res.json(users);
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const user = await adminService.updateUserStatus(id, status);
        res.json({ message: `User status updated to ${status}`, user });
    } catch (error) {
        console.error('Error in updateUserStatus:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error updating user status' });
    }
};

const suspendUser = async (req, res) => {
    try {
        const user = await adminService.suspendUser(req.params.id);
        res.json({ message: 'User suspended successfully', user });
    } catch (error) {
        console.error('Error in suspendUser:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error suspending user' });
    }
};

const reactivateUser = async (req, res) => {
    try {
        const user = await adminService.reactivateUser(req.params.id);
        res.json({ message: 'User reactivated successfully', user });
    } catch (error) {
        console.error('Error in reactivateUser:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error reactivating user' });
    }
};

// 3. Listing Moderation
const getAllListings = async (req, res) => {
    try {
        const listings = await adminService.getAllListings();
        res.json(listings);
    } catch (error) {
        console.error('Error in getAllListings:', error);
        res.status(500).json({ error: 'Server error fetching listings' });
    }
};

const updateListingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const post = await adminService.updateListingStatus(id, status);
        res.json({ message: `Listing status updated to ${status}`, post });
    } catch (error) {
        console.error('Error in updateListingStatus:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error updating listing status' });
    }
};

// 4. Category Management
const getCategories = async (req, res) => {
    try {
        const categories = await adminService.getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error in getCategories:', error);
        res.status(500).json({ error: 'Server error fetching categories' });
    }
};

const createCategory = async (req, res) => {
    try {
        const category = await adminService.createCategory(req.body);
        res.status(201).json({ message: 'Category created', category });
    } catch (error) {
        console.error('Error in createCategory:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error creating category' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await adminService.updateCategory({
            id: req.params.id,
            ...req.body
        });
        res.json({ message: 'Category updated', category });
    } catch (error) {
        console.error('Error in updateCategory:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error updating category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const result = await adminService.deleteCategory(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error in deleteCategory:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error deleting category' });
    }
};

// 5. Inquiry Monitoring
const getAllInquiries = async (req, res) => {
    try {
        const inquiries = await adminService.getAllInquiries();
        res.json(inquiries);
    } catch (error) {
        console.error('Error in getAllInquiries:', error);
        res.status(500).json({ error: 'Server error fetching inquiries' });
    }
};

// 6. KYC Management
const getPendingKycApplications = async (req, res) => {
    try {
        const applications = await adminService.getPendingKycApplications(req.query);
        res.json(applications);
    } catch (error) {
        console.error('Error in getPendingKycApplications:', error);
        res.status(500).json({ error: 'Server error fetching KYC applications' });
    }
};

const getKycDetails = async (req, res) => {
    try {
        const details = await adminService.getKycDetails(req.params.userId);
        res.json(details);
    } catch (error) {
        console.error('Error in getKycDetails:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error fetching KYC details' });
    }
};

const approveKyc = async (req, res) => {
    try {
        const kyc = await adminService.approveKyc({
            userId: req.params.userId,
            adminId: req.user.id,
            io: req.io
        });
        res.json({ message: `User ${req.params.userId} approved as seller`, kyc });
    } catch (error) {
        console.error('Error in approveKyc:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error approving KYC' });
    }
};

const rejectKyc = async (req, res) => {
    try {
        const kyc = await adminService.rejectKyc({
            userId: req.params.userId,
            adminId: req.user.id,
            reason: req.body.reason,
            io: req.io
        });
        res.json({ message: `KYC application for user ${req.params.userId} rejected`, kyc });
    } catch (error) {
        console.error('Error in rejectKyc:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error rejecting KYC' });
    }
};

// Reports Export
const getReportCsv = async (req, res) => {
    try {
        const { csvString, filename } = await adminService.getReportData(req.query.type);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvString);
    } catch (error) {
        console.error('Error generating CSV report:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error generating report' });
    }
};

const togglePaidPromotionsAccess = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;
        const user = await adminService.togglePaidPromotionsAccess(id, enabled);
        res.json({ message: `Paid promotions access ${enabled ? 'granted' : 'revoked'} successfully`, user });
    } catch (error) {
        console.error('Error in togglePaidPromotionsAccess:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error toggling paid promotions access' });
    }
};

const getFraudReports = async (req, res) => {
    try {
        const reports = await adminService.getFraudReports();
        res.json(reports);
    } catch (error) {
        console.error('Error in getFraudReports:', error);
        res.status(500).json({ error: 'Server error fetching fraud reports' });
    }
};

const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const report = await adminService.updateReportStatus(id, status);
        res.json({ message: `Report status updated to ${status}`, report });
    } catch (error) {
        console.error('Error in updateReportStatus:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error updating report status' });
    }
};

// 7. Admin Notifications
const getAdminNotifications = async (req, res) => {
    try {
        const notifications = await adminService.getAdminNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error('Error in getAdminNotifications:', error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notification = await adminService.markNotificationRead(req.params.id, req.user.id);
        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Error in markNotificationRead:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error marking notification as read' });
    }
};

// 8. Security & IP Tracking
const getLoginHistory = async (req, res) => {
    try {
        const history = await adminService.getLoginHistory(req.query.search);
        res.json(history);
    } catch (error) {
        console.error('Error in getLoginHistory:', error);
        res.status(500).json({ error: 'Server error fetching login history' });
    }
};

const getIpBlacklist = async (req, res) => {
    try {
        const blacklist = await adminService.getIpBlacklist();
        res.json(blacklist);
    } catch (error) {
        console.error('Error in getIpBlacklist:', error);
        res.status(500).json({ error: 'Server error fetching IP blacklist' });
    }
};

const addIpToBlacklist = async (req, res) => {
    try {
        const { ip_address, reason } = req.body;
        const record = await adminService.addIpToBlacklist(ip_address, reason);
        res.status(201).json({ message: 'IP added to blacklist', record });
    } catch (error) {
        console.error('Error in addIpToBlacklist:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error adding IP to blacklist' });
    }
};

const removeIpFromBlacklist = async (req, res) => {
    try {
        const record = await adminService.removeIpFromBlacklist(req.params.ip);
        res.json({ message: 'IP removed from blacklist', record });
    } catch (error) {
        console.error('Error in removeIpFromBlacklist:', error);
        res.status(error.statusCode || 500).json({ error: error.message || 'Server error removing IP from blacklist' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    suspendUser,
    reactivateUser,
    getAllListings,
    updateListingStatus,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getAllInquiries,
    getPendingKycApplications,
    getKycDetails,
    approveKyc,
    rejectKyc,
    getReportCsv,
    togglePaidPromotionsAccess,
    getFraudReports,
    updateReportStatus,
    getAdminNotifications,
    markNotificationRead,
    getLoginHistory,
    getIpBlacklist,
    addIpToBlacklist,
    removeIpFromBlacklist
};

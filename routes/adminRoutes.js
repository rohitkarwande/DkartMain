const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const bannerController = require('../controllers/bannerController');
const featureFlagController = require('../controllers/featureFlagController');
const upload = require('../middlewares/upload');
const authMiddleware = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/role');
const auditLog = require('../middlewares/auditLog');

// All admin routes must be protected
router.use(authMiddleware, isAdmin);

// 1. Dashboard Statistics
router.get('/dashboard', adminController.getDashboardStats);

// 1.5 Reports
router.get('/reports/csv', auditLog('EXPORT_CSV', 'report'), adminController.getReportCsv);

// 2. User Management
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/status', auditLog('UPDATE_USER_STATUS', 'user'), adminController.updateUserStatus);
router.patch('/users/:id/suspend', auditLog('SUSPEND_USER', 'user'), adminController.suspendUser);
router.patch('/users/:id/reactivate', auditLog('REACTIVATE_USER', 'user'), adminController.reactivateUser);
router.patch('/users/:id/paid-promotions', auditLog('TOGGLE_PAID_PROMOTIONS_ACCESS', 'user'), adminController.togglePaidPromotionsAccess);

// 3. Listing Moderation
router.get('/listings', adminController.getAllListings);
router.patch('/listings/:id/status', auditLog('UPDATE_LISTING_STATUS', 'listing'), adminController.updateListingStatus);

// 4. Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', auditLog('CREATE_CATEGORY', 'category'), adminController.createCategory);
router.put('/categories/:id', auditLog('UPDATE_CATEGORY', 'category'), adminController.updateCategory);
router.delete('/categories/:id', auditLog('DELETE_CATEGORY', 'category'), adminController.deleteCategory);

// 5. Inquiry Monitoring
router.get('/inquiries', adminController.getAllInquiries);

// 6. KYC Management
router.get('/kyc', adminController.getPendingKycApplications);
router.get('/kyc/:userId', adminController.getKycDetails);
router.post('/kyc/:userId/approve', auditLog('APPROVE_KYC', 'kyc_document'), adminController.approveKyc);
router.post('/kyc/:userId/reject', auditLog('REJECT_KYC', 'kyc_document'), adminController.rejectKyc);

// 7. Admin Notifications
router.get('/notifications', adminController.getAdminNotifications);
router.put('/notifications/:id/read', adminController.markNotificationRead);

// 8. Security & IPs
router.get('/login-history', adminController.getLoginHistory);
router.get('/ip-blacklist', adminController.getIpBlacklist);
router.post('/ip-blacklist', auditLog('BLACKLIST_IP', 'security'), adminController.addIpToBlacklist);
router.delete('/ip-blacklist/:ip', auditLog('UNBLACKLIST_IP', 'security'), adminController.removeIpFromBlacklist);

// 9. Hero Carousel & Banner Management
router.get('/banners', bannerController.getAllBanners);
router.post('/banners', upload.single('image'), auditLog('CREATE_BANNER', 'hero_banner'), bannerController.createBanner);
router.put('/banners/:id', upload.single('image'), auditLog('UPDATE_BANNER', 'hero_banner'), bannerController.updateBanner);
router.delete('/banners/:id', auditLog('DELETE_BANNER', 'hero_banner'), bannerController.deleteBanner);
router.post('/banners/reorder', auditLog('REORDER_BANNERS', 'hero_banner'), bannerController.reorderBanners);

// 10. Feature Flags Management
router.get('/feature-flags', featureFlagController.getFeatureFlags);
router.patch('/feature-flags/:key', auditLog('UPDATE_FEATURE_FLAG', 'feature_flag'), featureFlagController.updateFeatureFlag);

// 11. Fraud Reports Management
router.get('/reports', adminController.getFraudReports);
router.patch('/reports/:id/status', auditLog('UPDATE_REPORT_STATUS', 'fraud_report'), adminController.updateReportStatus);

module.exports = router;


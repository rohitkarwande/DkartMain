/**
 * DKart Services Barrel Export
 * Grouped by domain/category
 */

module.exports = {
  // --- AUTH ---
  authService: require('./auth/authService'),
  userService: require('./auth/userService'),

  // --- EQUIPMENT ---
  equipmentService: require('./equipment/equipmentService'),
  vendorService: require('./equipment/vendorService'),

  // --- COMMUNICATION ---
  inquiryService: require('./communication/inquiryService'),
  dealService: require('./communication/dealService'),
  chatService: require('./communication/chatService'),
  sellerService: require('./communication/sellerService'),

  // --- NOTIFICATIONS ---
  notificationService: require('./notifications/notificationService'),
  adminNotificationService: require('./notifications/adminNotificationService'),
  emailService: require('./notifications/emailService'),

  // --- MARKETING ---
  bannerService: require('./marketing/bannerService'),
  promotionService: require('./marketing/promotionService'),
  engagementService: require('./marketing/engagementService'),
  analyticsService: require('./marketing/analyticsService'),

  // --- ADMIN ---
  adminService: require('./admin/adminService'),
  auditService: require('./admin/auditService'),
  featureFlagService: require('./admin/featureFlagService'),
  reportService: require('./admin/reportService'),

  // --- SUPPORT ---
  ticketService: require('./support/ticketService'),
  serviceRequestService: require('./support/serviceRequestService'),
  legalService: require('./support/legalService'),
  contactService: require('./support/contactService'),

};

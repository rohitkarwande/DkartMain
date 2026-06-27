const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const uploadKyc = require('../middlewares/uploadKyc');

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
// KYC: supports multipart/form-data for file upload
router.post('/kyc', uploadKyc.single('document_file'), userController.submitKyc);
router.get('/kyc/status', userController.getKycStatus);
// become-seller is locked — only admin can promote via /api/admin/kyc/:userId/approve
router.post('/become-seller', userController.becomeSeller);
router.get('/dashboard', userController.getDashboard);
router.post('/add-contact', userController.addContact);
router.post('/verify-contact', userController.verifyContact);

module.exports = router;


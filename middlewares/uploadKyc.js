const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure KYC upload directory exists
const kycUploadDir = path.join(__dirname, '../public/uploads/kyc');
if (!fs.existsSync(kycUploadDir)) {
    fs.mkdirSync(kycUploadDir, { recursive: true });
}

const kycStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, kycUploadDir);
    },
    filename: function (req, file, cb) {
        const userId = req.user ? req.user.id : 'unknown';
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `kyc-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

const kycFileFilter = (req, file, cb) => {
    // Accept images and PDFs for KYC documents
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|pdf|PDF)$/)) {
        req.fileValidationError = 'Only image (JPG, PNG, GIF) and PDF files are allowed for KYC documents!';
        return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
};

const uploadKyc = multer({
    storage: kycStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for KYC docs
    fileFilter: kycFileFilter,
});

module.exports = uploadKyc;

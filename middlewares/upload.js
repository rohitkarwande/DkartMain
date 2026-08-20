const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../public/uploads');
const videoDir = path.join(__dirname, '../public/uploads/videos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Videos go to a separate subfolder for organisation
        if (file.mimetype.startsWith('video/')) {
            cb(null, videoDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images, videos and CSV files
    const allowedImageExt = /\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/;
    const allowedVideoExt = /\.(mp4|MP4|mov|MOV|avi|AVI|webm|WEBM|mkv|MKV)$/;
    const allowedCsvExt = /\.(csv|CSV)$/;

    if (
        allowedImageExt.test(file.originalname) ||
        allowedVideoExt.test(file.originalname) ||
        allowedCsvExt.test(file.originalname)
    ) {
        cb(null, true);
    } else {
        req.fileValidationError = 'Only image, video, and CSV files are allowed!';
        return cb(new Error('Only image, video, and CSV files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (covers videos)
    fileFilter: fileFilter 
});

module.exports = upload;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Prefix file with timestamp and user ID (if available) to ensure uniqueness
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname.replace(/\\s+/g, '_'));
    },
});

// File filter (Optional: restrict to certain file types like images or pdfs)
// Currently accepting all, but showing how to restrict.
const fileFilter = (req, file, cb) => {
    // const allowedTypes = /jpeg|jpg|png|pdf/;
    // const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    // const mimetype = allowedTypes.test(file.mimetype);
    // if (extname && mimetype) {
    //   return cb(null, true);
    // } else {
    //   cb('Error: Only images and PDFs are allowed!');
    // }
    cb(null, true);
};

// Initialize multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter,
});

// Generate Download Link utility
const generateDownloadLink = (req, filename) => {
    return `${req.protocol}://${req.get('host')}/api/files/download/${filename}`;
};

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private (Needs Authentication)
router.post('/upload', authMiddleware, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            return res.status(400).json({ message: err });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const downloadLink = generateDownloadLink(req, req.file.filename);

        res.status(200).json({
            message: 'File uploaded successfully',
            file: {
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                downloadLink: downloadLink
            }
        });
    });
});

// @route   GET /api/files/download/:filename
// @desc    Download a file
// @access  Public (Can be made Private by adding authMiddleware if needed)
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                // Only sending response if headers haven't been sent yet
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error downloading file' });
                }
            }
        });
    } else {
        res.status(404).json({ message: 'File not found' });
    }
});

module.exports = router;

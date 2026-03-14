const express = require('express');
const multer = require('multer');
const { uploadToS3 } = require('../handlers/uploadHandlers');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// S3 upload endpoint
router.post('/s3', upload.single('file'), uploadToS3);

module.exports = router;
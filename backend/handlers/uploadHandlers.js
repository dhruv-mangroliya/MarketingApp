const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    const { folder = 'products' } = req.body;
    const fileName = `${folder}/${Date.now()}-${req.file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    });

    console.log('Attempting S3 upload...');
    await s3Client.send(command);
    
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    console.log('Upload successful:', url);
    
    res.json({ success: true, url });
  } catch (error) {
    console.error('S3 upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadToS3 };
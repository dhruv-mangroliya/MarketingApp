export const uploadToS3 = async (file, folder = 'products') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  
  try {
    const response = await fetch('http://localhost:5001/api/upload/s3', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      return data.url;
    } else {
      throw new Error(data.message || 'Upload failed');
    }
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};
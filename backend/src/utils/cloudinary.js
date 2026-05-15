const uploadImage = async (filePath) => {
  if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') {
    // Stub implementation
    console.log(`[CLOUDINARY STUB] Mock uploading image: ${filePath}`);
    return `https://dummyimage.com/600x400/ccc/000.png&text=mock_image_${Date.now()}`;
  }
  
  // Real implementation
  // const cloudinary = require('cloudinary').v2;
  // cloudinary.config({ ... });
  // const result = await cloudinary.uploader.upload(filePath);
  // return result.secure_url;
  
  return null;
};

module.exports = { uploadImage };

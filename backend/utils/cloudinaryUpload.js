const cloudinary = require("../config/cloudinary");

const uploadFile = async (filePath) => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: "auto",
    folder: "knest_notes",
  });

  return result.secure_url;
};

module.exports = uploadFile;

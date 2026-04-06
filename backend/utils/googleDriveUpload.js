const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

const KEYFILEPATH = path.join(__dirname, "../config/googleDriveKey.json");

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const drive = google.drive({
  version: "v3",
  auth,
});

const FOLDER_ID = "1jEs0u6Zl-rjgkoAfbUnx8UFzlLi4HjNA";

const uploadFile = async (filePath, fileName, mimeType) => {
  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: mimeType,
      body: fs.createReadStream(filePath),
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return response.data.id;
};

module.exports = uploadFile;

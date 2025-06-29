const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Đường dẫn tới file JSON key của service account
const KEYFILEPATH = path.join(__dirname, '../../gdrive-service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const DEFAULT_FOLDER_ID = process.env.GDRIVE_FOLDER_ID; // Lấy từ biến môi trường

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function uploadFileToDrive(localFilePath, fileName, folderId = DEFAULT_FOLDER_ID) {
  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  const media = {
    mimeType: 'video/mp4', // hoặc lấy từ file upload
    body: fs.createReadStream(localFilePath),
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  // Set quyền public cho file nếu muốn
  await drive.permissions.create({
    fileId: res.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Xóa file local sau khi upload thành công
  fs.unlinkSync(localFilePath);

  return res.data; // { id, webViewLink, webContentLink }
}

module.exports = { uploadFileToDrive }; 
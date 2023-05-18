const multer = require('multer');
const multerS3 = require('multer-s3');
const { extname } = require('path');

const s3 = require('../awsS3Client');

const random = () => Math.round(Math.random() * 10000 + 10000);

module.exports = {
  limits: { fileSize: 25000000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
      return cb(new multer.MulterError('Formato de arquivo inválido.'));
    }
    return cb(null, true);
  },
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `profile-photo/imgs/${Date.now()}_${random()}${extname(file.originalname)}`);
    },
  }),
};

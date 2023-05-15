const multer = require('multer');
const { resolve, extname } = require('path');

const random = () => Math.round(Math.random() * 10000 + 10000);

module.exports = {
  limits: { fileSize: 25000000 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
      return cb(new multer.MulterError('Formato de arquivo inválido.'));
    }
    return cb(null, true);
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, resolve(__dirname, '..', '..', '..', 'uploads', 'profile-photo', 'imgs'));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${random()}${extname(file.originalname)}`);
    },
  }),
};

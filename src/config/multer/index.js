const multer = require('multer');
const { extname, resolve } = require('path');

const random = () => Math.floor(Math.random() * 10000 + 10000);
const fileMimetypes = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
];

module.exports = {
  fileFilter: (req, file, cb) => {
    if (fileMimetypes.indexOf(file.mimetype) == -1) {
      return cb(new multer.MulterError('Formato de arquivo inválido.'));
    }
    return cb(null, true);
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(
        null,
        file.mimetype == 'image/png' ||
          file.mimetype == 'image/jpeg' ||
          file.mimetype == 'image/gif'
          ? resolve(__dirname, '..', '..', '..', 'uploads', 'imgs')
          : resolve(__dirname, '..', '..', '..', 'uploads', 'videos')
      );
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${random()}${extname(file.originalname)}`);
    },
  }),
};

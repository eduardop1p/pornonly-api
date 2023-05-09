const multer = require('multer');
const { extname, resolve } = require('path');

const random = () => Math.floor(Math.random() * 10000 + 10000);

module.exports = {
  fileFilter: (req, file, cb) => {
    console.log(file.mimetype);
    if (
      file.mimetype !== 'image/png' &&
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'video/mp4' &&
      file.mimetype !== 'video/quicktime' &&
      file.mimetype !== 'video/webm' &&
      file.mimetype !== 'video/x-m4v'
    ) {
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

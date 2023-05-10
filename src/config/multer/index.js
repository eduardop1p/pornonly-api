const multer = require('multer');
const { extname, resolve } = require('path');

const midiaMimetypes = require('../../services/midiaMimetypes');
const { imgsMimetypes } = require('../../services/midiaMimetypes');

const random = () => Math.floor(Math.random() * 10000 + 10000);

module.exports = {
  fileFilter: (req, file, cb) => {
    if (midiaMimetypes.indexOf(file.mimetype) == -1) {
      return cb(new multer.MulterError('Formato de arquivo inválido.'));
    }
    return cb(null, true);
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(
        null,
        imgsMimetypes.indexOf(file.mimetype) !== -1
          ? resolve(__dirname, '..', '..', '..', 'uploads', 'imgs')
          : resolve(__dirname, '..', '..', '..', 'uploads', 'videos')
      );
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${random()}${extname(file.originalname)}`);
    },
  }),
};

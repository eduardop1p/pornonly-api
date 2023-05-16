const multer = require('multer');
const { extname, resolve } = require('path');

const midiaMimetypes = require('../../services/midiaMimetypes');
const { imgsMimetypes, gifsMimetypes } = require('../../services/midiaMimetypes');

const random = () => Math.floor(Math.random() * 10000 + 10000);

const destinationPath = file => {
  if (imgsMimetypes.indexOf(file.mimetype) !== -1)
    return resolve(__dirname, '..', '..', '..', 'uploads', 'imgs');
  if (gifsMimetypes.indexOf(file.mimetype) !== -1)
    return resolve(__dirname, '..', '..', '..', 'uploads', 'gifs');
  return resolve(__dirname, '..', '..', '..', 'uploads', 'videos');
};

module.exports = {
  limits: { fileSize: 550000000 },
  fileFilter: (req, file, cb) => {
    if (midiaMimetypes.indexOf(file.mimetype) == -1) {
      return cb(new multer.MulterError('Formato de arquivo não suportado.'));
    }
    return cb(null, true);
  },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationPath(file));
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}_${random()}${extname(file.originalname)}`);
    },
  }),
};

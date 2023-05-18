const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotEnv = require('dotenv');
const { extname, resolve } = require('path');

dotEnv.config(resolve(__dirname, '..', '..', '..', '.env'));

const midiaMimetypes = require('../../services/midiaMimetypes');
const { imgsMimetypes, gifsMimetypes } = require('../../services/midiaMimetypes');

const random = () => Math.floor(Math.random() * 10000 + 10000);

const destinationPath = file => {
  if (imgsMimetypes.indexOf(file.mimetype) !== -1)
    return `imgs/${Date.now()}_${random()}${extname(file.originalname)}`;
  if (gifsMimetypes.indexOf(file.mimetype) !== -1)
    return `gifs/${Date.now()}_${random()}${extname(file.originalname)}`;
  return `videos/${Date.now()}_${random()}${extname(file.originalname)}`;
};

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = {
  limits: { fileSize: 550000000 },
  fileFilter: (req, file, cb) => {
    if (midiaMimetypes.indexOf(file.mimetype) == -1) {
      return cb(new multer.MulterError('Formato de arquivo não suportado.'));
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
      cb(null, destinationPath(file));
    },
  }),
};

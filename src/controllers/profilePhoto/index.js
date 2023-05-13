const multer = require('multer');

const multerConfig = require('../../config/multerProfilePhoto');

const upload = multer(multerConfig).single('photo');

class ProfileController {
  async store(req, res) {
    return upload(req, res, err => {
      if (err) {
        res.status(400).json({
          error: err.code == 'LIMIT_FILE_SIZE' ? 'Tamanho de arquivo não suportado.' : err.code,
        });
        return;
      }

      const { mimetype, filename } = req.file;
      const { userId } = req;

      if (!userId || typeof userId !== 'string') {
        res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
        return;
      }

      res.json(req.file);
    });
  }
}

module.exports = new ProfileController();

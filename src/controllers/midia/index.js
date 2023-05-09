const multer = require('multer');

const multerConfig = require('../../config/multer');

const upload = multer(multerConfig).single('midia');

class MidiaController {
  async store(req, res) {
    return upload(req, res, err => {
      if (err) {
        res.status(400).json({ error: err.code });
        return;
      }

      res.json(req.file);
    });
  }
}

module.exports = new MidiaController();

const multer = require('multer');
const { resolve } = require('path');

const Midia = require('../../models/midia');
const multerConfig = require('../../config/multerMidia');
const { imgsMimetypes, gifsMimetypes } = require('../../services/midiaMimetypes');

const upload = multer(multerConfig).single('midia');

class MidiaController {
  async store(req, res) {
    return upload(req, res, async err => {
      if (err instanceof multer.MulterError) {
        res.status(400).json({
          error:
            err.code == 'LIMIT_FILE_SIZE'
              ? 'Arquivo com tamanho acima de 500MB não suportado.'
              : err.code,
        });
        return;
      }

      const { mimetype, key, location } = req.file;
      const { userId } = req;

      if (!userId || typeof userId !== 'string') {
        res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
        return;
      }

      const midiaTypes = () => {
        if (imgsMimetypes.indexOf(mimetype) != -1) return 'img';
        if (gifsMimetypes.indexOf(mimetype) != -1) return 'gif';
        return 'video';
      };

      const { title, description } = req.body;

      if (title.length > 30) {
        res
          .status(400)
          .json({ error: 'Titulo muito grande, tente um titulo com menos de 30 caracteres.' });
        return;
      }

      if (description.length > 100) {
        res.status(400).json({
          error: 'Descrição muito grande, tente uma descrição com menos de 100 caracteres.',
        });
        return;
      }

      const midiaType = midiaTypes();
      const tags = req.body.tags.split(' ');
      const path = key;
      const url = location;

      const body = {
        title,
        description,
        midiaType,
        tags,
        userId,
        path,
        url,
      };

      const midia = new Midia(body);

      await midia.storeMidia();

      if (midia.errors.length) {
        res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
        return;
      }

      res.json({
        success: 'Você adcionou uma nova publicação.',
      });
    });
  }

  async show(req, res) {
    const { apiKey, midiaId } = req.params;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    const midia = new Midia();
    const midiaInfo = await midia.showMidia(midiaId);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async index(req, res) {
    const { apiKey } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaUsers(page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midiaUsers: midiaInfo });
  }

  async indexAllMidiaUserId(req, res) {
    const { userId } = req;
    const page = parseInt(req.query.page) || 1;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaUserId(userId, page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midiaUser: midiaInfo });
  }

  async indexAllMidiaPackId(req, res) {
    const { apiKey, packId } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaPackId(packId, page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midiaPack: midiaInfo });
  }

  async deleteOne(req, res) {
    const { midiaId } = req.params;

    if (!midiaId || typeof midiaId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const midia = new Midia();

    await midia.deleteOneMidia(midiaId);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({
      success: 'Publicação deletada com sucesso.',
    });
  }

  async deleteAll(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const midia = new Midia();

    await midia.deleteAllMidia(userId);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({
      success: 'Todas as publicação foram deletadas com sucesso.',
    });
  }
}

module.exports = new MidiaController();

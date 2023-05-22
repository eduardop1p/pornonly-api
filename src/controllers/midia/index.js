const multer = require('multer');
const { resolve } = require('path');

const Midia = require('../../models/midia');
const multerConfig = require('../../config/multerMidia');
const { imgsMimetypes, gifsMimetypes } = require('../../services/midiaMimetypes');
const deleteObjectS3 = require('../../services/deleteObjectS3');

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

      if (!req.file) {
        res.status(400).json({ error: 'Erro desconhecido tente novalmente' });
        return;
      }
      const { mimetype, key } = req.file;

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
      const tags = req.body.tags.trimEnd().split(' ');
      const path = key;
      const url = `${process.env.CURRENT_DOMAIN}/${key}`;

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
        try {
          await deleteObjectS3(path);
        } catch {
          res.status(500).json({
            error: 'Erro interno no servidor tente novalmente.',
          });
        }
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

    res.json({ midia: midiaInfo });
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

    res.json({ midia: midiaInfo });
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

    res.json({ midia: midiaInfo });
  }

  async indexAllMidiaType(req, res) {
    const { apiKey, midiaType } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaType(midiaType, page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexAllMidiaDay(req, res) {
    const { apiKey } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaDay(page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexSearch(req, res) {
    const { apiKey } = req.params;
    const searchQuery = String(req.query.search_query) || '';
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    if (searchQuery.length > 30) {
      res.status(400).json({ error: 'Tente uma pesquisa com menos de 30 caracteres.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaSearchQuery(searchQuery, page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexSearchTags(req, res) {
    const { apiKey } = req.params;
    const searchTags = req.query.search_tags.toLowerCase().split(',') || [];
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    if (searchTags.length > 5) {
      res.status(400).json({ error: 'Tente uma pesquisa com menos de 5 tags.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaSearchTags(searchTags, page);

    if (midia.errors.length) {
      res.status(midia.errors[0].code).json({ error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
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

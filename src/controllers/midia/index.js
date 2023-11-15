const multer = require('multer');
const { resolve } = require('path');
const { get } = require('lodash');
const { decode } = require('jsonwebtoken');
const unorm = require('unorm');

const Midia = require('../../models/midia');
const multerConfig = require('../../config/multerMidia');
const { imgsMimetypes, gifsMimetypes } = require('../../services/midiaMimetypes');
const deleteObjectS3 = require('../../services/deleteObjectS3');
const getVideoDimensions = require('../../config/getVideoDimensions');
const getImageDimensions = require('../../config/getImageDimensions');

const upload = multer(multerConfig).fields([
  { name: 'midia', maxCount: 1 },
  { name: 'thumb', maxCount: 1 },
]);

class MidiaController {
  async store(req, res) {
    return upload(req, res, async err => {
      if (err instanceof multer.MulterError) {
        res.status(400).json({
          type: 'server',
          error:
            err.code == 'LIMIT_FILE_SIZE'
              ? 'Arquivo com tamanho acima de 500MB não suportado.'
              : err.code,
        });
        return;
      }

      if (!req.files || !req.files.midia) {
        res.status(400).json({ type: 'server', error: 'Erro desconhecido, tente novalmente.' });
        return;
      }
      const midiaFile = req.files.midia[0];
      const thumbFile = get(req.files, 'thumb', false);

      // const contentLength = Buffer.byteLength(req.file);
      // res.apppend('Content-Length', contentLength);

      const { mimetype, key } = midiaFile;

      const { userId } = req;

      if (!userId || typeof userId !== 'string') {
        res
          .status(401)
          .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
        return;
      }

      const midiaTypes = () => {
        if (imgsMimetypes.indexOf(mimetype) != -1) return 'img';
        if (gifsMimetypes.indexOf(mimetype) != -1) return 'gif';
        return 'video';
      };

      const { title, author, description } = req.body;

      if (title.length > 100) {
        res.status(400).json({
          type: 'title',
          error: 'Titulo muito grande, tente um titulo com menos de 100 caracteres.',
        });
        return;
      }

      if (description.length > 100) {
        res.status(400).json({
          type: 'description',
          error: 'Descrição muito grande, tente uma descrição com menos de 500 caracteres.',
        });
        return;
      }

      // const videoMetada = await getVideoDimensions(req.file.location);
      // const imageMetada = await getImageDimensions(req.file.location);

      const removeAccents = value => {
        if (!/[áàãâäéèêëíìîïóòõôöúùûüç]/.test(value)) return;
        return unorm.nfkd(value).replace(/[\u0300-\u036f]/g, '');
      };

      const midiaType = midiaTypes();
      const path = key;
      const tagsQuery = req.body.tags.trim().split(',');
      const tags = [
        ...tagsQuery,
        ...tagsQuery.map(tag => removeAccents(tag)).filter(val => val != null || val != undefined),
      ];
      const url = `${process.env.CURRENT_DOMAIN}/${path}`;
      const thumb = thumbFile ? `${process.env.CURRENT_DOMAIN}/${thumbFile[0].key}` : '';
      const imgDimensions = await getImageDimensions(`${process.env.CURRENT_DOMAIN}/${path}`);
      const imgHeight = imgDimensions.height;
      const imgWidth = imgDimensions.width;
      const videoDimensions = await getVideoDimensions(`${process.env.CURRENT_DOMAIN}/${path}`);
      const videoHeight = videoDimensions.height;
      const videoWidth = videoDimensions.width;
      const videoDuration = videoDimensions.duration;
      const dimensionsMidia = {
        width: midiaType === 'video' ? videoWidth : imgWidth,
        height: midiaType === 'video' ? videoHeight : imgHeight,
        duration: midiaType === 'video' ? videoDuration : '',
      };
      let status = 'pending';
      if (req.isAdmin) status = 'published';

      const body = {
        title,
        author,
        description,
        midiaType,
        tags,
        userId,
        path,
        url,
        thumb,
        status,
        ...dimensionsMidia,
      };

      const midia = new Midia(body);

      await midia.storeMidia();

      if (midia.errors.length) {
        try {
          if (thumbFile) await deleteObjectS3([{ Key: thumbFile[0].key }]);
          await deleteObjectS3([{ Key: path }]);
        } catch {
          res.status(500).json({
            type: 'server',
            error: 'Erro interno no servidor tente novalmente.',
          });
          return;
        }
        res
          .status(midia.errors[0].code)
          .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
        return;
      }

      res.json({
        success: 'Você adcionou uma nova publicação.',
      });
    });
  }

  async show(req, res) {
    const { midiaId } = req.params;

    const midia = new Midia();
    const midiaInfo = await midia.showMidia(midiaId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json(midiaInfo);
  }

  async index(req, res) {
    const page = parseInt(req.query.page) || 1;
    const midiaType = req.query.midiaType;
    const order = req.query.order;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaUsers(page, midiaType, order);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async storeLikeInComment(req, res) {
    const { midiaId } = req.params;
    const { userId } = req;

    if (!midiaId) {
      return res.status(500).json({ type: 'server', error: 'Erro ao processar requisição' });
    }

    const midia = new Midia();
    await midia.storeCommentLike(userId, midiaId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ success: 'Pin adcionado like.' });
  }

  async unclickLikeInComment(req, res) {
    const { midiaId } = req.params;
    const { userId } = req;

    if (!midiaId) {
      return res.status(500).json({ type: 'server', error: 'Erro ao processar requisição' });
    }

    const midia = new Midia();
    await midia.unclickCommentLike(userId, midiaId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ success: 'Pin removido like.' });
  }

  async indexAllMidiaUserId(req, res) {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const midiaType = req.query.midiaType;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaUserId(userId, midiaType, page);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexAllMidiaPackId(req, res) {
    const { packId } = req.params;
    const page = parseInt(req.query.page) || 1;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaPackId(packId, page);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexAllMidiaPackNoId(req, res) {
    const page = parseInt(req.query.page) || 1;
    const { userId } = req;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaPackNoId(page, userId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexAllMidiaType(req, res) {
    const { midiaType } = req.params;
    const page = parseInt(req.query.page) || 1;
    const order = req.query.order;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaType(midiaType, page, order);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexAllMidiaDay(req, res) {
    const page = parseInt(req.query.page) || 1;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaDay(page);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexSearch(req, res) {
    const searchQuery = String(req.query.search_query) || '';
    const page = parseInt(req.query.page) || 1;

    if (searchQuery.length > 50) {
      res
        .status(400)
        .json({ type: 'search', error: 'Tente uma pesquisa com menos de 50 caracteres.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaSearchQuery(searchQuery, page);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async indexSearchTags(req, res) {
    const searchTags = req.query.search_tags.trim().split(',') || [];
    const page = parseInt(req.query.page) || 1;
    const midiaType = req.query.midiaType;
    const order = req.query.order;

    if (searchTags.length > 5) {
      res.status(400).json({ type: 'tags', error: 'Tente uma pesquisa com menos de 5 tags.' });
      return;
    }

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaSearchTags(searchTags, page, order, midiaType);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async delete(req, res) {
    let midiaDelete = req.query.midiaDelete;
    const sendEmail = req.query.sendEmail;

    if (!midiaDelete) return res.send();
    try {
      midiaDelete = JSON.parse(midiaDelete);
    } catch {
      return res.status(500).json({
        type: 'server',
        error: 'Erro ao processar resposta',
      });
    }
    const { userId } = req;

    const midia = new Midia();

    await midia.deleteMidia(midiaDelete, userId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    if (sendEmail) {
      // enviar email aqui para avisar ao dono user da publicação que não foi aceita
    }

    res.json({
      success: 'Publicação deletada com sucesso.',
    });
  }

  async deleteAll(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const midia = new Midia();

    await midia.deleteAllMidia(userId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({
      success: 'Todas as publicação foram deletadas com sucesso.',
    });
  }

  async showMidiaTitles(req, res) {
    const { search_query } = req.query;
    if (!search_query) return res.json({ midiaTitles: [] });

    const midia = new Midia();

    const midiaTitles = await midia.showAllMidiaTitles(search_query);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midiaTitles: midiaTitles });
  }

  async showMidiaTags(req, res) {
    const { tag } = req.query;
    if (!tag) return res.json({ midiaTags: [] });

    const midia = new Midia();

    const midiaTags = await midia.showAllMidiaTags(tag);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midiaTags });
  }

  async indexMidiaTagsCategory(req, res) {
    const midia = new Midia();

    const midiaTags = await midia.indexAllMidiaTags();

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midiaTags });
  }

  async indexAllMidiaUserIdLength(req, res) {
    const { userId } = req.params;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaUserIdLength(userId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async updateMidia(req, res) {
    const midia = new Midia();

    await midia.updateMidia();

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ success: 'update midia' });
  }

  async indexAllMidiaPending(req, res) {
    const page = parseInt(req.query.page) || 1;

    const midia = new Midia();

    const midiaInfo = await midia.getAllMidiaPending(page);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json({ midia: midiaInfo });
  }

  async acceptMidiaPending(req, res) {
    const { midiaId } = req.params;

    const midia = new Midia();

    await midia.acceptMidiaPending(midiaId);

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    // enviar email aqui para avisar ao dono user da publicação que ela foi aceita

    res.json({
      success: 'Publicação aceita.',
    });
  }
}

module.exports = new MidiaController();

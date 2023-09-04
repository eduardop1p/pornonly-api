const Packs = require('../../models/packs');

class PacksController {
  async store(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const { title, description } = req.body;

    if (title.length > 30) {
      res.status(400).json({
        type: 'title',
        error: 'Titulo muito grande, tente um titulo com menos de 30 caracteres.',
      });
      return;
    }

    if (description.length > 100) {
      res.status(400).json({
        type: 'description',
        error: 'Descrição muito grande, tente uma descrição com menos de 100 caracteres.',
      });
      return;
    }

    const midiaId = req.query.midiaId ? req.query.midiaId.split(',') : [];

    const body = {
      title,
      description,
      userId,
    };

    const packs = new Packs(body);
    await packs.storePack(midiaId);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({
      success: 'Pack criado.',
    });
  }

  async storeMidiaInPack(req, res) {
    const { userId } = req;
    const { packId } = req.params;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }
    if (!packId) {
      res.status(400).json({ type: 'server', error: 'Busca inválida.' });
      return;
    }

    const midiaId = req.query.midiaId ? req.query.midiaId.split(',') : [];

    const packs = new Packs();
    await packs.storeMidiaInPack(packId, midiaId);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({
      success: 'Midia(s) adcionada(s) no pack.',
    });
  }

  async deleteMidiaInPack(req, res) {
    const { userId } = req;
    const { packId } = req.params;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }
    if (!packId) {
      res.status(400).json({ type: 'server', error: 'Busca inválida.' });
      return;
    }

    const midiaId = req.query.midiaId || [];

    const packs = new Packs();
    await packs.deleteMidiaInPack(packId, midiaId);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({
      success: 'Midia(s) removida(s) do pack.',
    });
  }

  async index(req, res) {
    const page = parseInt(req.query.page) || 1;

    const packs = new Packs();
    const packsInfo = await packs.getAllPacks(page);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({
      packs: packsInfo,
    });
  }

  async indexAllPacksUserId(req, res) {
    const page = parseInt(req.query.page) || 1;
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const packs = new Packs();
    const packsInfo = await packs.getAllPacksUserId(userId, page);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({
      packs: packsInfo,
    });
  }

  async deleteOne(req, res) {
    const { userId } = req;
    const { packId } = req.params;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    if (!packId) {
      res.status(401).json({ type: 'server', error: 'Pack não existe na base de dados.' });
      return;
    }

    const packs = new Packs();
    await packs.deleteOnePack(packId);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({ success: 'Pack excluido.' });
  }

  async deleteAll(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const packs = new Packs();
    await packs.deleteAllPack(userId);

    if (packs.errors.length) {
      res
        .status(packs.errors[0].code)
        .json({ type: packs.errors[0].type, error: packs.errors[0].msg });
      return;
    }

    res.json({ success: 'Todos os packs foram excluidos.' });
  }
}

module.exports = new PacksController();

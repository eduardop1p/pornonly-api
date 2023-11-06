const Saves = require('../../models/saves');

class SavesController {
  async index(req, res) {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const save = new Saves();

    const allSaveUser = await save.indexSave(userId, page);

    if (save.errors.length) {
      res
        .status(save.errors[0].code)
        .json({ type: save.errors[0].type, error: save.errors[0].msg });
      return;
    }

    res.json({ midia: allSaveUser });
  }

  async indexAllSavesLength(req, res) {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const save = new Saves();

    const allSaveUser = await save.indexSaveLength(userId);

    if (save.errors.length) {
      res
        .status(save.errors[0].code)
        .json({ type: save.errors[0].type, error: save.errors[0].msg });
      return;
    }

    res.json({ midia: allSaveUser });
  }

  async store(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const { midiaId } = req.params;

    const save = new Saves();

    await save.storeSave(userId, midiaId);

    if (save.errors.length) {
      res
        .status(save.errors[0].code)
        .json({ type: save.errors[0].type, error: save.errors[0].msg });
      return;
    }

    res.json({ type: 'server', success: 'Pin salvo' });
  }

  async delete(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const { midiaId } = req.params;

    const save = new Saves();

    await save.deleteSave(userId, midiaId);

    if (save.errors.length) {
      res
        .status(save.errors[0].code)
        .json({ type: save.errors[0].type, error: save.errors[0].msg });
      return;
    }

    res.json({ type: 'server', success: 'Pin removido dos salvos' });
  }
}

module.exports = new SavesController();

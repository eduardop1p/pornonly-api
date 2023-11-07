const { Schema, Types, model } = require('mongoose');

const { UsersModel } = require('../users');

const savesSchema = new Schema({
  midia: { type: Types.ObjectId, ref: 'Midia' },
  userId: { type: Types.ObjectId, ref: 'Users' },
  createIn: { type: Date, default: Date.now },
});

const SavesModel = model('Saves', savesSchema);

module.exports = class Saves {
  constructor(body) {
    this.body = body;
    this.save = null;
    this.errors = [];
  }

  async indexSave(userId, midiaType, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await SavesModel.find({
        userId,
      })
        .select(['midia'])
        .populate({
          path: 'midia',
          select: [
            '_id',
            'title',
            'midiaType',
            'width',
            'height',
            'description',
            'tags',
            'url',
            'userId',
            'thumb',
            'duration',
            'createIn',
          ],
          match: { midiaType: midiaType ? midiaType : { $exists: true } },
          populate: {
            path: 'userId',
            select: ['_id', 'username', 'profilePhoto'],
            populate: {
              path: 'profilePhoto',
              select: ['_id', 'url'],
            },
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort({ createIn: -1 });

      const total = (await SavesModel.find({ userId }).select(['_id'])).length;
      this.save = {
        results: results.filter(obj => obj.midia !== null).map(obj => obj.midia),
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.save;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async indexSaveLength(userId) {
    try {
      const results = await SavesModel.find({ userId }).select(['_id']);

      const total = results.length;
      this.save = {
        totalResults: total,
      };

      return this.save;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storeSave(userId, midiaId) {
    try {
      let user = await UsersModel.findById(userId);
      if (user.saves.includes(midiaId)) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Pin já adcionado aos salvos.',
        });
        return;
      }

      await SavesModel.create({
        midia: midiaId,
        userId,
      });
      user.saves.push(midiaId);
      await user.save();

      return;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteSave(userId, midiaId) {
    try {
      let user = await UsersModel.findById(userId);

      if (!user.saves.includes(midiaId)) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Pin já removido dos salvos.',
        });
        return;
      }
      await SavesModel.deleteOne({ userId, midia: midiaId });

      user.saves = user.saves.filter(id => id.toString() !== midiaId.toString());
      await user.save();

      return;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }
};

module.exports.SavesModel = SavesModel;

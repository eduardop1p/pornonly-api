const { Schema, Types, model } = require('mongoose');

const { MidiaModel } = require('../midia');

const packsSchema = new Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  userId: [{ type: Types.ObjectId, ref: 'Users' }],
  createIn: { type: Date, default: new Date() },
});

const PacksModel = model('Packs', packsSchema);

module.exports = class Packs {
  constructor(body) {
    this.body = body;
    this.pack = null;
    this.errors = [];
  }

  async getAllPacks(page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const total = await PacksModel.countDocuments();

      const results = await PacksModel.find()
        .select(['_id', 'title', 'description', 'userId', 'createIn'])
        .populate({
          path: 'userId',
          select: ['_id', 'name', 'profilePhoto'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort({
          createIn: -1,
        });

      this.pack = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.pack;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllPacksUserId(userId, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await PacksModel.find({ userId })
        .select(['_id', 'title', 'description', 'createIn'])
        .skip(startIndex)
        .limit(pageLimit)
        .sort({
          createIn: -1,
        });

      const total = results.length;

      this.pack = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.pack;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storePack(midiaId) {
    const { title } = this.body;

    await this.packExist(title);
    if (this.errors.length) return;

    try {
      this.pack = await PacksModel.create(this.body);

      if (!this.pack) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao criar pack.',
        });
        return;
      }

      if (!midiaId.join('')) return;

      const midias = await MidiaModel.find({ _id: { $in: midiaId } });
      midias.forEach(async midia => {
        midia.packId.push(this.pack._id);
        await midia.save();
      });

      return;
    } catch (err) {
      // console.log(err);
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storeMidiaInPack(packId, midiaId) {
    try {
      if (!midiaId.join('')) return;

      const midias = await MidiaModel.find({ _id: { $in: midiaId } });

      if (!midias.length) {
        this.errors.push({
          code: 400,
          msg: 'Erro nenhuma publicação adcionada.',
        });
        return;
      }

      midias.forEach(async midia => {
        midia.packId.push(packId);
        await midia.save();
      });

      return;
    } catch (err) {
      console.log(err);
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteMidiaInPack(packId, midiaId) {
    try {
      if (!midiaId.join('')) return;

      const midias = await MidiaModel.find({ _id: { $in: midiaId } });

      if (!midias.length) {
        this.errors.push({
          code: 400,
          msg: 'Erro nenhuma publicação removida.',
        });
        return;
      }

      midias.forEach(async midia => {
        midia.packId = [];
        await midia.save();
      });

      return;
    } catch (err) {
      console.log(err);
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteOnePack(packId) {
    try {
      this.pack = await PacksModel.findByIdAndDelete(packId);

      if (!this.pack) {
        this.errors.push({
          code: 400,
          msg: 'Erro pack não existe na base de dados.',
        });
        return;
      }

      return;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteAllPack(userId) {
    try {
      this.pack = await PacksModel.deleteMany({ userId });

      if (!this.pack.deletedCount) {
        this.errors.push({
          code: 400,
          msg: 'Erro packs não existem na base de dados.',
        });
        return;
      }

      return;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async packExist(title) {
    try {
      this.pack = await PacksModel.findOne({ title });

      if (this.pack) {
        this.errors.push({
          code: 400,
          msg: 'Já existe um pack com esse titulo, tente outro titulo.',
        });
        return;
      }

      return;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }
};

module.exports.PacksModel = PacksModel;
const { Schema, model, Types } = require('mongoose');
const { rm } = require('fs/promises');
const { resolve } = require('path');

const { UsersModel } = require('../users');
const deleteObjectS3 = require('../../services/deleteObjectS3');

const MidiaSchema = new Schema({
  title: { type: String, required: false, text: true, default: 'Nenhum titulo aqui.' },
  description: { type: String, default: 'Nenhum descrição para este titulo.' },
  midiaType: { type: String, require: true },
  tags: { type: Array },
  userId: [{ type: Types.ObjectId, ref: 'Users' }],
  packId: [{ type: Types.ObjectId, ref: 'Packs' }],
  path: { type: String, require: true },
  url: { type: String, require: true },
  createIn: { type: Date, default: Date.now },
});

const MidiaModel = model('Midia', MidiaSchema);

module.exports = class Midia {
  constructor(body) {
    this.body = body;
    this.user = null;
    this.midia = null;
    this.errors = [];
  }

  async getAllMidiaUsers(page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const total = await MidiaModel.countDocuments();

      const results = await MidiaModel.find() // tras os resultados em ordem crescente com sort 1
        .select(['_id', 'title', 'description', 'userId', 'url', 'createIn'])
        .sort({ createIn: 1 })
        .skip(startIndex) // o método skit() vai ignorar um numero de documentos da página anterior
        .limit(pageLimit)
        .populate({
          path: 'userId',
          select: ['_id', 'name', 'email'],
        });

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch (err) {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaUserId(userId, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await MidiaModel.find({ userId })
        .select(['_id', 'title', 'description', 'midiaType', 'tags', 'userId', 'url', 'createIn'])
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
        .sort({ createIn: -1 });

      const total = results.length;

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaPackId(packId, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await MidiaModel.find({ packId })
        .select(['_id', 'title', 'description', 'midiaType', 'tags', 'userId', 'url', 'createIn'])
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
        .sort({ createIn: -1 });

      const total = results.length;

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaSearchQuery(searchQuery, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      // const results = await MidiaModel.find({ $text: { $search: searchQuery } })
      const results = await MidiaModel.find({ title: { $regex: searchQuery, $options: 'i' } })
        .select(['_id', 'title', 'description', 'midiaType', 'tags', 'userId', 'url', 'createIn'])
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
        .sort({ createIn: -1 });

      const total = results.length;

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch (err) {
      console.log(err);
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaSearchTags(searchTags, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      // const results = await MidiaModel.find({ $text: { $search: searchTags } })
      const results = await MidiaModel.find({ tags: { $all: searchTags } })
        .select(['_id', 'title', 'description', 'midiaType', 'tags', 'userId', 'url', 'createIn'])
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
        .sort({ createIn: -1 });

      const total = results.length;

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch (err) {
      console.log(err);
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showMidia(midiaId) {
    try {
      this.midia = await MidiaModel.findById(midiaId)
        .select(['_id', 'title', 'description', 'midiaType', 'tags', 'userId', 'url', 'createIn'])
        .populate({
          path: 'userId',
          select: ['_id', 'name', 'profilePhoto'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        });

      if (!this.midia) {
        this.errors.push({
          code: 400,
          msg: 'Midia não existe na base de dados',
        });
        return;
      }

      return this.midia;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storeMidia() {
    const { userId } = this.body;

    await this.userExist(userId);
    if (this.errors.length) return;

    try {
      this.midia = await MidiaModel.create(this.body);

      if (!this.midia) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao adcionar foto de usuário.',
        });
        return;
      }

      this.user.midia.push(this.midia._id);

      await this.user.save();

      return;
    } catch (err) {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteOneMidia(midiaId) {
    try {
      this.midia = await MidiaModel.findByIdAndDelete(midiaId).select(['_id', 'path', 'userId']);

      if (!this.midia) {
        this.errors.push({
          code: 400,
          msg: 'Publicação não existe na base de dados.',
        });
        return;
      }

      const userId = this.midia.userId[0];

      this.user = await UsersModel.findById(userId);
      this.user.midia = this.user.midia.filter(
        id => id.toHexString() != this.midia._id.toHexString()
      );
      await this.user.save();

      try {
        await deleteObjectS3(this.midia.path);
      } catch {
        this.errors.push({
          code: 400,
          msg: 'Erro ao deletar publicação tente novalmente.',
        });
      }

      return;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteAllMidia(userId) {
    try {
      this.midia = await MidiaModel.find({ userId }).select(['_id', 'path']);

      if (!this.midia.length) {
        this.errors.push({
          code: 400,
          msg: 'Publicações não existem na base de dados.',
        });
        return;
      }

      await MidiaModel.deleteMany({ userId });

      this.user = await UsersModel.findById(userId);
      this.user.midia = [];
      await this.user.save();

      try {
        this.midia.forEach(async midia => {
          await deleteObjectS3(midia.path);
        });
      } catch {
        this.errors.push({
          code: 500,
          msg: 'Erro interno no servidor, tente deletar as publicações novalmente.',
        });
      }

      return;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async userExist(userId) {
    try {
      this.user = await UsersModel.findById(userId);

      if (!this.user) {
        this.errors.push({
          code: 400,
          msg: 'Usuário não existe na base de dados.',
        });
        return;
      }

      return this.user;
    } catch (err) {
      console.log(err);

      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }
};

module.exports.MidiaModel = MidiaModel;

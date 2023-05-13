const { Schema, model, Types } = require('mongoose');
const { rm } = require('fs/promises');
const { resolve } = require('path');

const { UsersModel } = require('../users');

const MidiaSchema = new Schema({
  title: { type: String, required: false, default: 'Nenhum titulo aqui.' },
  description: { type: String, default: 'Nenhum descrição para este titulo.' },
  midiaType: { type: String, require: true },
  tags: { type: Array },
  userId: [{ type: Types.ObjectId, ref: 'Users' }],
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
        .select(['_id', 'title', 'description', 'midiaType', 'tags', 'userId', 'url', 'createIn'])
        .sort({ createIn: 1 })
        .skip(startIndex) // o método skit() vai ignorar um numero de documentos da página anterior
        .limit(pageLimit)
        .populate({
          path: 'userId',
          select: ['_id', 'name', 'email'],
        });

      if (!results) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao pegar dados.',
        });
        return;
      }

      this.midia = {
        results,
        currentPage: parseInt(page),
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

      const userId = this.midia.userId[0];

      this.user = await UsersModel.findById(userId);
      this.user.midia = this.user.midia.filter(
        id => id.toHexString() != this.midia._id.toHexString()
      );
      this.user.save();

      if (!this.midia) {
        this.errors.push({
          code: 400,
          msg: 'Publicação não existe na base de dados.',
        });
        return;
      }

      try {
        await rm(resolve(this.midia.path));
      } catch {
        this.errors.push({
          code: 500,
          msg: 'Erro interno no servidor, tente deletar a publicação novalmente.',
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
      this.user.save();

      try {
        this.midia.forEach(async midia => {
          await rm(resolve(midia.path));
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
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }
};

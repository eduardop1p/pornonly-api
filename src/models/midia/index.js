const { Schema, model, Types } = require('mongoose');

const { UsersModel } = require('../users');

const MidiaSchema = new Schema({
  title: { type: String, required: false, default: 'Nenhum titulo aqui.' },
  description: { type: String, default: 'Nenhum descrição para este titulo.' },
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

  async getAllMidiaUsers() {
    try {
      this.midia = await MidiaModel.find({}, null, { sort: { createIn: -1 } })
        .select(['_id', 'title', 'description', 'tags', 'userId', 'url', 'createIn'])
        .sort({ createIn: -1 })
        .populate({
          path: 'userId',
          select: ['_id', 'name', 'email'],
        });

      if (!this.midia) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao pegar dados.',
        });
        return;
      }

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

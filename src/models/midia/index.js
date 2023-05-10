const { Schema, model } = require('mongoose');

const { UsersModel } = require('../users');

const MidiaSchema = new Schema({
  title: { type: String, required: false, default: 'Nenhum titulo aqui.' },
  descripton: { type: String, default: 'Nenhum descrição para este titulo.' },
  tags: { type: Array },
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

  async storeMidia(userId) {
    this.userExist(userId);
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

      return this.midia;
    } catch (err) {
      console.log(err);
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
      return;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }
};

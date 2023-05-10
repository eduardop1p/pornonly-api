const mongoose = require('mongoose');

const { UsersModel } = require('../users');

module.exports = class Login {
  constructor(body) {
    this.body = body;
    this.user = null;
    this.errors = [];
  }

  async userLogin() {
    try {
      this.user = await UsersModel.findOne({ ...this.body }).select([
        '_id',
        'name',
        'midia',
        'email',
      ]);

      if (!this.user) {
        this.errors.push({
          code: 401,
          msg: 'E-mail ou senha incorreto.',
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

  async userExist() {
    const { email } = this.body;

    try {
      this.user = await UsersModel.findOne({ email });

      if (this.user) {
        this.errors.push({
          code: 400,
          msg: 'Usuário não existe.',
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

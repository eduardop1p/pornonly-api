const mongoose = require('mongoose');

const { UsersModel } = require('../users');

module.exports = class Login {
  constructor(body) {
    this.body = body;
    this.user = null;
    this.errors = [];
  }

  async userLogin() {
    await this.userExist();
    if (this.errors.length) return;

    try {
      const { email, password } = this.body;

      this.user = await UsersModel.findOne({ password }).select(['_id', 'name', 'email']);
      if (!this.user) {
        this.errors.push({
          type: 'password',
          code: 401,
          msg: 'A senha que você inseriu não está correta. Tente novamente ou troque a senha.',
        });
        return;
      }

      return this.user;
    } catch (err) {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async userExist() {
    const { email } = this.body;

    try {
      this.user = await UsersModel.findOne({ email });

      if (!this.user) {
        this.errors.push({
          type: 'email',
          code: 400,
          msg: 'O E-mail inserido não pertence a nenhuma conta..',
        });
        return;
      }

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

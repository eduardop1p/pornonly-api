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

    try {
      const { email, password } = this.body;

      const userEmail = await UsersModel.findOne({ email }).select(['_id', 'name', 'email']);
      if (!userEmail) {
        this.errors.push({
          type: 'email',
          code: 401,
          msg: 'O E-mail que inserido não pertence a nenhuma conta.',
        });
        return;
      }

      const userPassword = await UsersModel.findOne({ password }).select(['_id', 'name', 'email']);
      if (!userPassword) {
        this.errors.push({
          type: 'password',
          code: 401,
          msg: 'A senha que você inseriu não está correta. Tenta novamente ou troque a senha.',
        });
        return;
      }

      return userEmail || userPassword;
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

      if (this.user) {
        this.errors.push({
          type: 'email',
          code: 400,
          msg: 'Usuário não existe.',
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

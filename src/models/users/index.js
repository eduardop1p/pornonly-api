const { Schema, model, Error } = require('mongoose');

const usersSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createIn: { type: Date, default: Date.now },
});

const UsersModel = model('Users', usersSchema);

module.exports = class Users {
  constructor(body) {
    this.body = body;
    this.user = null;
    this.errors = [];
  }

  async getAllUsers() {
    try {
      this.user = await UsersModel.find().sort({ createIn: -1 });

      if (!this.user) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao pegar usuários.',
        });
        return;
      }

      return this.user;
    } catch (err) {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storeUser() {
    this.clearUpDataUser();

    await this.userExist();
    if (this.errors.length) return;

    try {
      this.user = await UsersModel.create(this.body);

      if (!this.user) {
        this.errors.push({
          code: 500,
          msg: 'Erro ao criar usuário.',
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

  async showUser(userId) {
    try {
      this.user = await UsersModel.findById(userId).select(['id', 'name', 'email', 'createIn']);

      if (!this.user) {
        this.errors.push({
          code: 500,
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

  async updateUser(userId) {
    this.clearUpDataUser();

    try {
      this.user = await UsersModel.findByIdAndUpdate(userId, this.body, { new: true }).select([
        'id',
        'name',
        'email',
        'createIn',
      ]);

      if (!this.user) {
        this.errors.push({
          code: 500,
          msg: 'Usuário não existe na base de dados.',
        });
        return;
      }

      return this.user;
    } catch (err) {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteUser(userId) {
    try {
      this.user = await UsersModel.findByIdAndDelete(userId);

      if (!this.user) {
        this.errors.push({
          code: 500,
          msg: 'Usuário não encontrado na base de dados.',
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

  async userExist() {
    const { email } = this.body;

    try {
      this.user = await UsersModel.findOne({ email });

      if (this.user) {
        this.errors.push({
          code: 400,
          msg: 'Já existe um usuário com este email.',
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

  clearUpDataUser() {
    this.body = {
      name: this.body.name ? this.body.name : undefined,
      email: this.body.email ? this.body.email : undefined,
      password: this.body.password ? this.body.password : undefined,
    };
  }
};

module.exports.UsersModel = UsersModel;

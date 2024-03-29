const mongoose = require('mongoose');
const { Schema, model, Types } = require('mongoose');
const { rm } = require('fs/promises');
const { resolve } = require('path');

const deleteObjectS3 = require('../../services/deleteObjectS3');

const usersSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePhoto: [{ type: Types.ObjectId, ref: 'ProfilePhotos' }],
  midia: [{ type: Types.ObjectId, require: false, ref: 'Midia' }],
  saves: [{ type: Types.ObjectId, require: false, ref: 'Saves' }],
  isAdmin: { type: Boolean, require: true, default: false },
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
          type: 'server',
          code: 400,
          msg: 'Erro ao pegar usuários.',
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

  async storeUser() {
    this.clearUpDataUser();

    await this.userExistUsername();
    await this.userExistEmail();
    if (this.errors.length) return;

    try {
      this.user = await UsersModel.create(this.body);

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Erro ao criar usuário.',
        });
        return;
      }

      return this.user;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showUserId(userId) {
    try {
      this.user = await UsersModel.findById(userId)
        .select(['_id', 'username', 'email', 'profilePhoto', 'saves', 'isAdmin'])
        .populate({
          path: 'profilePhoto',
          select: ['_id', 'url', 'userId'],
        });

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Usuário não existe na base de dados.',
        });
        return;
      }

      return this.user;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showUserName(usernameparam) {
    // const pageLimit = 30;
    // const startIndex = (midiaPage - 1) * pageLimit; // startIndex vai ser o tanto de documentos a ser ignorados com o skip
    // const endIndex = midiaPage * pageLimit;

    try {
      this.user = await UsersModel.findOne({ username: usernameparam })
        .select(['_id', 'username', 'email', 'profilePhoto', 'createIn', 'isAdmin'])
        .populate({
          path: 'profilePhoto',
          select: ['_id', 'url', 'userId'],
        });
      // .populate({
      //   path: 'midia',
      //   select: [
      //     '_id',
      //     'title',
      //     'midiaType',
      //     'width',
      //     'height',
      //     'description',
      //     'tags',
      //     'url',
      //     'createIn',
      //   ],
      //   options: { skip: startIndex, limit: pageLimit, sort: { createIn: -1 } },
      // })
      // .populate({
      //   path: 'saves',
      //   select: [
      //     '_id',
      //     'title',
      //     'midiaType',
      //     'width',
      //     'height',
      //     'description',
      //     'tags',
      //     'url',
      //     'userId',
      //     'createIn',
      //   ],
      //   options: { skip: startIndex, limit: pageLimit, sort: { createIn: -1 } },
      //   populate: {
      //     path: 'userId',
      //     select: ['_id', 'username', 'profilePhoto'],
      //     populate: {
      //       path: 'profilePhoto',
      //       select: ['_id', 'url'],
      //     },
      //   },
      // });

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Usuário não existe na base de dados.',
        });
        return;
      }

      // const total = this.user.midia.length;
      // const newUser = {
      //   _id: this.user._id,
      //   username: this.user.username,
      //   email: this.user.email,
      //   profilePhoto: this.user.profilePhoto,
      //   profilePhoto: this.user.profilePhoto,
      //   midia: {
      //     results: [...this.user.midia],
      //     currentPage: midiaPage,
      //     totalPages: Math.ceil(total / pageLimit),
      //     totalResults: total,
      //   },
      //   saves: this.user.saves,
      //   createIn: this.user.createIn,
      // };

      return this.user;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async updateUser(userId) {
    this.clearUpDataUser();

    try {
      this.user = await UsersModel.findByIdAndUpdate(userId, this.body, { new: true }).select([
        '_id',
        'username',
        'email',
        'midia',
        'createIn',
      ]);

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Usuário não existe na base de dados.',
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

  async deleteUser(userId) {
    try {
      this.user = await UsersModel.findByIdAndDelete(userId);
      const profilePhoto = await mongoose.models.ProfilePhotos.findOne({ userId });
      const midias = await mongoose.models.Midia.find({ userId });

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Usuário não encontrado na base de dados.',
        });
        return;
      }
      await mongoose.models.ProfilePhotos.deleteMany({ userId });
      await mongoose.models.Comments.deleteMany({ userId });
      await mongoose.models.Midia.deleteMany({ userId });

      try {
        await deleteObjectS3(profilePhoto.path);
      } catch {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao deletar foto de perfil.',
        });
      }

      midias.forEach(async midia => {
        try {
          await deleteObjectS3(midia.path);
        } catch {
          this.errors.push({
            type: 'server',
            code: 400,
            msg: 'Erro ao deletar todas as publicações do perfil.',
          });
        }
      });

      return;
    } catch (err) {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async userExistEmail() {
    const { email } = this.body;

    try {
      this.user = await UsersModel.findOne({ email });

      if (this.user) {
        this.errors.push({
          type: 'email',
          code: 400,
          msg: 'Já existe um usuário com este email. Tente novalmente com outro e-mail.',
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

  async userExistPassword(email) {
    try {
      this.user = await UsersModel.findOne({ email });

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Nenhum usuário encontrado com este email',
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

  async userExistUsername() {
    const { username } = this.body;

    try {
      this.user = await UsersModel.findOne({ username });

      if (this.user) {
        this.errors.push({
          type: 'username',
          code: 400,
          msg: 'Já existe um usuário com este username. Tente novalmente com outro username.',
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

  clearUpDataUser() {
    this.body = {
      username: this.body.username ? this.body.username : undefined,
      email: this.body.email ? this.body.email : undefined,
      password: this.body.password ? this.body.password : undefined,
    };
  }
};

module.exports.UsersModel = UsersModel;

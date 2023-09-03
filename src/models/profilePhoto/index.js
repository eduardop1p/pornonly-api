const { Types, model, Schema } = require('mongoose');
const { rm } = require('fs/promises');
const { resolve } = require('path');

const { UsersModel } = require('../users');
const deleteObjectS3 = require('../../services/deleteObjectS3');

const ProfilePhotosSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'Users' },
  url: { type: String },
  path: { type: String },
  createIn: { type: Date, default: Date.now },
});

const ProfilePhotosModel = model('ProfilePhotos', ProfilePhotosSchema);

module.exports = class ProfilePhotos {
  constructor(body) {
    this.body = body;
    this.photo = null;
    this.user = null;
    this.errors = [];
  }

  async storeProfilePhoto(userId) {
    await this.userExist(userId);
    if (this.errors.length) return;

    try {
      this.foto = await ProfilePhotosModel.findOne({ userId }).select(['_id']);
      if (this.foto) {
        await this.deletePhotoMidia(userId);
        if (this.errors.length) return;
      }

      this.photo = await ProfilePhotosModel.create(this.body);

      if (!this.photo) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao adcionar foto de perfil.',
        });
        return;
      }

      await UsersModel.findByIdAndUpdate(userId, { profilePhoto: this.photo._id });

      return await ProfilePhotosModel.findById(this.photo._id).select(['_id', 'url']);
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deletePhotoMidia(userId) {
    await this.userExist(userId);
    if (this.errors.length) return;

    try {
      this.photo = await ProfilePhotosModel.findOneAndDelete({ userId });

      if (!this.photo) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro foto de perfil não existe na base de dados.',
        });
        return;
      }

      try {
        await deleteObjectS3(this.photo.path);
      } catch {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Erro interno no servidor, tente deletar a foto novalmente.',
        });
      }

      this.user.profilePhoto = [];
      await this.user.save();

      return;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showProfilePhoto(userId) {
    try {
      this.photo = await ProfilePhotosModel.findOne({ userId }).select(['_id', 'url', 'createIn']);

      if (!this.photo) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao pegar foto de usuário na base de dados.',
        });
        return;
      }

      return this.photo;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllProfilePhotos() {
    try {
      this.photo = await ProfilePhotosModel.find().sort({
        createIn: -1,
      });

      if (!this.photo) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao pegar fotos de usuários na base de dados.',
        });
        return;
      }

      return this.photo;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async userExist(userId) {
    try {
      this.user = await UsersModel.findById(userId).select(['_id']);

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 400,
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
};

module.exports.ProfilePhotosModel = ProfilePhotosModel;

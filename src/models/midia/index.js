const { Schema, model, Types } = require('mongoose');
const { rm } = require('fs/promises');
const { resolve } = require('path');
const unorm = require('unorm');

const { UsersModel } = require('../users');
const { ProfilePhotosModel } = require('../profilePhoto');
const deleteObjectS3 = require('../../services/deleteObjectS3');
const { SavesModel } = require('../../models/saves');

const MidiaSchema = new Schema({
  title: { type: String, required: false, text: true, default: '' },
  author: { type: String, required: false, default: '' },
  description: { type: String, default: 'Nenhum descrição para este titulo.' },
  midiaType: { type: String, require: true },
  width: { type: String, require: true },
  likes: {
    likes: { type: Number, required: false, default: 0 },
    users: [{ type: Types.ObjectId, ref: 'Users' }],
  },
  height: { type: String, require: true },
  tags: { type: Array },
  userId: { type: Types.ObjectId, ref: 'Users' },
  packId: [{ type: Types.ObjectId, ref: 'Packs' }],
  path: { type: String, require: true },
  url: { type: String, require: true },
  thumb: { type: String, require: false },
  duration: { type: String, require: false },
  status: { type: String, require: true, default: 'pending' },
  createIn: { type: Date, default: Date.now },
});

const MidiaModel = model('Midia', MidiaSchema);

const TagsSchema = new Schema({
  tag: { type: String, require: true },
});

const TagsModel = model('Tags', TagsSchema);

module.exports = class Midia {
  constructor(body) {
    this.body = body;
    this.user = null;
    this.midia = null;
    this.errors = [];
  }

  escapedStrint(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  removeAccents(value) {
    return unorm.nfkd(value).replace(/[\u0300-\u036f]/g, '');
  }

  orderBy(order) {
    if (order === 'popular') return { likes: -1, createIn: -1 };
    if (order === 'desc') return { createIn: -1 };
    if (order === 'asc') return { createIn: 1 };

    return undefined;
  }

  async getAllMidiaUsers(page, midiaType, order) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const total = await MidiaModel.countDocuments();

      const results = await MidiaModel.find({
        midiaType:
          midiaType !== 'undefined' && typeof midiaType !== 'undefined'
            ? midiaType
            : { $exists: true },
        status: 'published',
      }) // tras os resultados em ordem crescente com sort 1
        .select([
          '_id',
          'title',
          'description',
          'userId',
          'url',
          'thumb',
          'duration',
          'midiaType',
          'likes',
          'height',
          'width',
          'status',
          'createIn',
        ])
        .sort(this.orderBy(order))
        .skip(startIndex) // o método skit() vai ignorar um numero de documentos da página anterior
        .limit(pageLimit)
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'email', 'profilePhoto', 'isAdmin'],
          populate: { path: 'profilePhoto', select: ['_id', 'url'] },
        });

      // consulta aleatória com todos os parametros acima mais com aggregate e $sample
      // const resultsDb = await MidiaModel.aggregate([
      //   {
      //     $match: {
      //       midiaType: midiaType ? midiaType : { $exists: true },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: UsersModel.collection.name,
      //       localField: 'userId',
      //       foreignField: '_id',
      //       as: 'userId',
      //       pipeline: [
      //         {
      //           $project: { _id: true, username: true, profilePhoto: true },
      //         },
      //       ],
      //     },
      //   },
      //   { $unwind: { path: '$userId' } },
      //   {
      //     $lookup: {
      //       from: ProfilePhotosModel.collection.name,
      //       localField: 'userId.profilePhoto',
      //       foreignField: '_id',
      //       as: 'userId.profilePhoto',
      //       pipeline: [
      //         {
      //           $project: {
      //             _id: true,
      //             url: true,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: true,
      //       title: true,
      //       midiaType: true,
      //       width: true,
      //       height: true,
      //       description: true,
      //       userId: true,
      //       url: true,
      //       thumb: true,
      //       duration: true,
      //       createIn: true,
      //     },
      //   },
      //   // { $sample: { size: pageLimit } },
      //   { $skip: startIndex },
      //   { $limit: pageLimit },
      // ]);

      // const results = resultsDb.sort(() => Math.random() - 0.5);

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
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaUserId(userId, midiaType, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await MidiaModel.find({
        userId,
        midiaType:
          midiaType !== 'undefined' && typeof midiaType !== 'undefined'
            ? midiaType
            : { $exists: true },
      })
        .select([
          '_id',
          'title',
          'description',
          'midiaType',
          'width',
          'height',
          'tags',
          'url',
          'thumb',
          'duration',
          'status',
          'createIn',
        ])
        .skip(startIndex)
        .limit(pageLimit)
        .sort({ createIn: -1 });

      const total = (await MidiaModel.find({ userId, status: 'published' }).select(['_id'])).length;

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch {
      this.errors.push({
        type: 'server',
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
      const results = await MidiaModel.find({ packId, status: 'published' })
        .select([
          '_id',
          'title',
          'description',
          'midiaType',
          'width',
          'height',
          'tags',
          'userId',
          'packId',
          'url',
          'thumb',
          'duration',
          'status',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'isAdmin'],
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
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaPackNoId(page, userId) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await MidiaModel.find({ packId: [], userId, status: 'published' })
        .select([
          '_id',
          'title',
          'description',
          'midiaType',
          'width',
          'height',
          'tags',
          'userId',
          'packId',
          'url',
          'thumb',
          'duration',
          'status',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'isAdmin'],
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
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaType(midiaType, page, order) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await MidiaModel.find({ midiaType, status: 'published' })
        .select([
          '_id',
          'title',
          'description',
          'userId',
          'url',
          'thumb',
          'duration',
          'midiaType',
          'tags',
          'likes',
          'height',
          'width',
          'status',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'isAdmin'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort(this.orderBy(order));

      // const resultsDb = await MidiaModel.aggregate([
      //   { $match: { midiaType } },
      //   // { $sample: { size: pageLimit } },
      //   {
      //     $lookup: {
      //       from: UsersModel.collection.name,
      //       localField: 'userId',
      //       foreignField: '_id',
      //       as: 'userId',
      //       pipeline: [{ $project: { _id: true, name: true, profilePhoto: true } }],
      //     },
      //   },
      //   { $unwind: { path: '$userId' } },
      //   {
      //     $lookup: {
      //       from: ProfilePhotosModel.collection.name,
      //       localField: 'userId.profilePhoto',
      //       foreignField: '_id',
      //       as: 'userId.profilePhoto',
      //       pipeline: [
      //         {
      //           $project: { _id: true, url: true },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: true,
      //       title: true,
      //       description: true,
      //       midiaType: true,
      //       width: true,
      //       height: true,
      //       tags: true,
      //       userId: true,
      //       url: true,
      //       thumb: true,
      //       duration: true,
      //       createIn: true,
      //     },
      //   },
      //   { $skip: startIndex },
      //   { $limit: pageLimit },
      // ]);

      // const results = resultsDb.sort(() => Math.random() - 0.5);
      const total = await MidiaModel.find({ midiaType, status: 'published' }).select(['_id']);

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total.length / pageLimit),
        totalResults: total.length,
      };

      return this.midia;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaDay(page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    const date = new Date();
    const startDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() - 1
    ).toLocaleDateString('en-ca');
    const endDate = new Date().toLocaleDateString('en-ca');

    try {
      // const results = await MidiaModel.find({ createIn: { $gte: startDate, $lte: endDate } })
      const results = await MidiaModel.find({ status: 'published' })
        .select([
          '_id',
          'title',
          'description',
          'midiaType',
          'width',
          'height',
          'tags',
          'userId',
          'url',
          'thumb',
          'duration',
          'status',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'isAdmin'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort({ createIn: -1 });

      const total = await MidiaModel.countDocuments();

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.midia;
    } catch (err) {
      // console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storeCommentLike(userId, midiaId) {
    try {
      this.midia = await MidiaModel.findById(midiaId);
      if (!this.midia) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Pin não encontrado',
        });
        return;
      }
      if (this.midia.likes.users.includes(userId.toString())) return;

      this.midia.likes.likes = parseInt(this.midia.likes.likes + 1);
      this.midia.likes.users.push(Types.ObjectId.createFromHexString(userId));
      await this.midia.save();
      return;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor',
      });
    }
  }

  async unclickCommentLike(userId, midiaId) {
    try {
      this.midia = await MidiaModel.findById(midiaId);
      if (!this.midia) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Comentário não encontrado',
        });
        return;
      }
      if (!this.midia.likes.users.includes(userId.toString())) return;

      this.midia.likes.likes = parseInt(this.midia.likes.likes - 1);
      this.midia.likes.users = this.midia.likes.users.filter(
        id => id.toString() !== userId.toString()
      );
      await this.midia.save();

      return;
    } catch (err) {
      // console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor',
      });
    }
  }

  async getAllMidiaSearchQuery(searchQuery, page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      // const results = await MidiaModel.find({ $text: { $search: searchQuery } })
      const results = await MidiaModel.find({
        $or: [
          { title: { $regex: new RegExp(`${this.escapedStrint(searchQuery)}?`, 'i') } },
          { author: { $regex: new RegExp(`${this.escapedStrint(searchQuery)}?`, 'i') } },
          { tags: { $regex: new RegExp(`${this.escapedStrint(searchQuery)}?`, 'i') } },
        ],
        status: 'published',
      })
        .select([
          '_id',
          'title',
          'description',
          'midiaType',
          'width',
          'height',
          'tags',
          'userId',
          'url',
          'thumb',
          'duration',
          'status',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'isAdmin'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort({ createIn: -1 });

      const total = await MidiaModel.find({
        $or: [
          { title: { $regex: new RegExp(`${this.escapedStrint(searchQuery)}?`, 'i') } },
          { author: { $regex: new RegExp(`${this.escapedStrint(searchQuery)}?`, 'i') } },
          { tags: { $regex: new RegExp(`${this.escapedStrint(searchQuery)}?`, 'i') } },
        ],
        status: 'published',
      }).select(['_id']);

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total.length / pageLimit),
        totalResults: total.length,
      };

      return this.midia;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaSearchTags(searchTags, page, order, midiaType) {
    if (!searchTags.join() || !searchTags.length) searchTags = ['ruivas', 'novinhas', 'loiras'];
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;
    const arrayRegex = searchTags.map(tag => ({
      tags: { $regex: new RegExp(`${this.escapedStrint(tag)}?`, 'i') },
    }));

    try {
      // const results = await MidiaModel.find({ $text: { $search: searchTags } })
      const results = await MidiaModel.find({
        $or: arrayRegex,
        midiaType:
          midiaType !== 'undefined' && typeof midiaType !== 'undefined'
            ? midiaType
            : { $exists: true },
        status: 'published',
      })
        .select([
          '_id',
          'title',
          'midiaType',
          'width',
          'height',
          'tags',
          'description',
          'userId',
          'url',
          'thumb',
          'duration',
          'status',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'isAdmin'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort(this.orderBy(order));

      // const resultsDb = await MidiaModel.aggregate([
      //   {
      //     $match: {
      //       $or: arrayRegex,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: UsersModel.collection.name,
      //       localField: 'userId',
      //       foreignField: '_id',
      //       as: 'userId',
      //       pipeline: [
      //         {
      //           $project: { _id: true, username: true, profilePhoto: true },
      //         },
      //       ],
      //     },
      //   },
      //   { $unwind: { path: '$userId' } },
      //   {
      //     $lookup: {
      //       from: ProfilePhotosModel.collection.name,
      //       localField: 'userId.profilePhoto',
      //       foreignField: '_id',
      //       as: 'userId.profilePhoto',
      //       pipeline: [
      //         {
      //           $project: {
      //             _id: true,
      //             url: true,
      //           },
      //         },
      //       ],
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: true,
      //       title: true,
      //       midiaType: true,
      //       tags: true,
      //       width: true,
      //       height: true,
      //       description: true,
      //       userId: true,
      //       url: true,
      //       thumb: true,
      //       duration: true,
      //       createIn: true,
      //     },
      //   },
      //   // { $sample: { size: pageLimit } },
      //   { $sort: this.orderBy(order) },
      //   { $skip: startIndex },
      //   { $limit: pageLimit },
      // ]);

      // const results = resultsDb.sort(() => Math.random() - 0.5);
      const total = await MidiaModel.find({
        $or: arrayRegex,
        midiaType:
          midiaType !== 'undefined' && typeof midiaType !== 'undefined'
            ? midiaType
            : { $exists: true },
        status: 'published',
      }).select(['_id']);

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total.length / pageLimit),
        totalResults: total.length,
      };

      return this.midia;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showMidia(midiaId) {
    try {
      this.midia = await MidiaModel.findById(midiaId)
        .select([
          '_id',
          'title',
          'description',
          'midiaType',
          'likes',
          'width',
          'height',
          'tags',
          'userId',
          'url',
          'thumb',
          'duration',
          'createIn',
        ])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto', 'midia', 'saves', 'isAdmin'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        });

      if (!this.midia) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Midia não existe na base de dados',
        });
        return;
      }

      return this.midia;
    } catch {
      this.errors.push({
        type: 'server',
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
          type: 'server',
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
        type: 'server',
        code: 500,
        msg: 'Erro ao adcionar foto de usuário.',
      });
    }
  }

  async deleteMidia(midiaDelete, userId) {
    try {
      const midiaDeleteIds = midiaDelete.map(value => value.id);
      const midiaDeletePaths = midiaDelete.map(value => ({ Key: value.key }));

      this.user = await UsersModel.findById(userId);

      this.midia = await MidiaModel.deleteMany({ _id: { $in: midiaDeleteIds } });

      if (!this.midia.deletedCount) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Publicação não existe na base de dados.',
        });
        return;
      }

      this.user = await UsersModel.findById(userId);
      this.user.midia = this.user.midia.filter(
        midiaId => !midiaDeleteIds.includes(midiaId.toString())
      );
      await this.user.save();
      await SavesModel.deleteMany({ midia: { $in: midiaDeleteIds } });

      try {
        await deleteObjectS3(midiaDeletePaths);
      } catch {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao deletar publicações tente novalmente.',
        });
        return;
      }

      return;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteAllMidia(userId) {
    try {
      this.midia = await MidiaModel.find({ userId, status: 'published' }).select(['_id', 'path']);

      if (!this.midia.length) {
        this.errors.push({
          type: 'server',
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
          type: 'server',
          code: 500,
          msg: 'Erro interno no servidor, tente deletar as publicações novalmente.',
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

  async userExist(userId) {
    try {
      this.user = await UsersModel.findById(userId);

      if (!this.user) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Usuário não existe na base de dados.',
        });
        return;
      }

      return this.user;
    } catch (err) {
      console.log(err);

      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showAllMidiaTitles(search_query) {
    try {
      const results = MidiaModel.aggregate([
        {
          $match: {
            title: {
              $regex: new RegExp(`${this.escapedStrint(search_query)}?`, 'i'),
            },
            status: 'published',
          },
        },
        {
          $group: {
            _id: '$title',
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 1,
            title: '$_id',
          },
        },
        {
          $limit: 10,
        },
      ]);
      return results;

      // const results = await MidiaModel.find({
      //   $or: [
      //     { title: { $regex: new RegExp(`${this.escapedStrint(search_query)}?`, 'i') } },
      //     // { tags: { $regex: new RegExp(`${search_query}?`, 'i') } },
      //   ],
      //   status: 'published',
      // })
      //   .select(['title'])
      //   .limit(10);

      // return results;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async showAllMidiaTags(tag) {
    try {
      const results = await TagsModel.find({
        $or: [
          { tag: { $regex: new RegExp(`${this.escapedStrint(tag)}?`, 'i') } },
          { tagNormalized: { $regex: new RegExp(`${this.escapedStrint(tag)}?`, 'i') } },
        ],
      })
        .select(['tag'])
        .limit(10);

      return results;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async indexAllMidiaTags() {
    try {
      const results = await TagsModel.find().select(['tag']);

      return results;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaUserIdLength(userId) {
    try {
      const results = await MidiaModel.find({ userId, status: 'published' }).select(['_id']);

      const total = results.length;

      this.midia = {
        totalResults: total,
      };

      return this.midia;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllCategory() {
    try {
      const allTags = (await TagsModel.find().select(['tag', ''])).map(val => val.tag);
      const arrayRegex = allTags.map(tag => ({
        tags: { $regex: new RegExp(`${this.escapedStrint(tag)}?`, 'i') },
        tagName: tag,
      }));

      const results = [];
      for (const regex of arrayRegex) {
        const newRegex = Object.entries(regex).map(([key, value]) => ({ [key]: value }));
        const result = await MidiaModel.findOne({
          midiaType: 'img',
          ...newRegex[0],
          status: 'published',
          $nor: results.length
            ? results.map(val => ({ _id: val._id }))
            : [{ _id: Types.ObjectId.createFromTime(1) }],
        })
          .select(['_id', 'title', 'width', 'height', 'status', 'url'])
          .sort(this.orderBy('popular'));

        try {
          if (!result._id) continue;
          results.push({
            _id: result._id,
            title: result.title,
            tag: regex.tagName,
            width: result.width,
            height: result.height,
            url: result.url,
          });
        } catch {
          continue;
        }
      }

      // console.log(results.map((val, index) => ({ val, tags: uniqueTagsArray[index] })));

      this.midia = { results };
      return this.midia;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async updateMidia() {
    try {
      // await MidiaModel.find().updateMany({ status: 'published' });

      return;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async getAllMidiaPending(page) {
    const pageLimit = 30;
    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const total = await MidiaModel.find({
        status: 'pending',
      }).select(['_id']);

      const results = await MidiaModel.find({
        status: 'pending',
      }) // tras os resultados em ordem crescente com sort 1
        .select([
          '_id',
          'title',
          'description',
          'userId',
          'url',
          'thumb',
          'duration',
          'midiaType',
          'likes',
          'height',
          'width',
          'status',
          'createIn',
        ])
        .skip(startIndex) // o método skit() vai ignorar um numero de documentos da página anterior
        .limit(pageLimit)
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'email', 'profilePhoto', 'isAdmin'],
          populate: { path: 'profilePhoto', select: ['_id', 'url'] },
        })
        .sort(this.orderBy('asc'));

      this.midia = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total.length / pageLimit),
        totalResults: total.length,
      };

      return this.midia;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async acceptMidiaPending(midiaId) {
    try {
      await MidiaModel.findByIdAndUpdate(midiaId, { status: 'published' }, { new: true });

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

module.exports.MidiaModel = MidiaModel;

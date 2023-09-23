const { Schema, model, Types } = require('mongoose');

const { MidiaModel } = require('../midia');

const CommentsSchema = new Schema({
  comment: { type: String, required: false },
  likes: {
    likes: { type: Number, required: false, default: 0 },
    users: [{ type: Types.ObjectId, ref: 'Users' }],
  },
  responses: [{ type: Types.ObjectId, ref: 'ResponsesComments' }],
  userId: { type: Types.ObjectId, ref: 'Users' },
  midiaId: [{ type: Types.ObjectId, ref: 'Midia' }],
  createIn: { type: Date, default: Date.now },
});

const CommentsModel = model('Comments', CommentsSchema);

module.exports = class Comments {
  constructor(body) {
    this.body = body;
    this.comment = null;
    this.midia = null;
    this.errors = [];
  }

  async storeComment(midiaId) {
    await this.midiaExist(midiaId);
    if (this.errors.length) return;

    try {
      this.comment = await CommentsModel.create(this.body);

      if (!this.comment) {
        this.errors.push({
          code: 500,
          msg: 'Erro ao adcionar novo comentario.',
        });
        return;
      }
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async storeCommentLike(userId, commentId) {
    try {
      this.comment = await CommentsModel.findById(commentId);
      if (!this.comment) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Comentário não encontrado',
        });
        return;
      }
      if (this.comment.likes.users.includes(userId.toString())) return;

      this.comment.likes.likes = parseInt(this.comment.likes.likes + 1);
      this.comment.likes.users.push(Types.ObjectId.createFromHexString(userId));
      await this.comment.save();
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

  async unclickCommentLike(userId, commentId) {
    try {
      this.comment = await CommentsModel.findById(commentId);
      if (!this.comment) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Comentário não encontrado',
        });
        return;
      }
      if (!this.comment.likes.users.includes(userId.toString())) return;

      this.comment.likes.likes = parseInt(this.comment.likes.likes - 1);
      this.comment.likes.users = this.comment.likes.users.filter(
        id => id.toString() !== userId.toString()
      );
      await this.comment.save();

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

  async getAllComments(midiaId, page) {
    await this.midiaExist(midiaId);
    if (this.errors.length) return;

    const pageLimit = 25;

    const startIndex = (page - 1) * pageLimit;
    const endIndex = page * pageLimit;

    try {
      const results = await CommentsModel.find({ midiaId })
        .select(['_id', 'comment', 'likes', 'responses', 'userId', 'createIn'])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .populate({
          path: 'responses',
          select: ['_id', 'comment', 'userId', 'likes', 'createIn'],
          options: { sort: { createIn: 1 } },
          populate: {
            path: 'userId',
            select: ['_id', 'username', 'profilePhoto'],
            populate: {
              path: 'profilePhoto',
              select: ['_id', 'url'],
            },
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort({ createIn: -1 });

      const total = results.length;

      this.comment = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.comment;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteOneComment(commentId) {
    try {
      this.comment = await CommentsModel.findByIdAndDelete(commentId);

      if (!this.comment) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao deletar comentário.',
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

  async deleteAllComment(userId) {
    try {
      this.comment = await CommentsModel.deleteMany({ userId });

      if (!this.comment.deletedCount) {
        this.errors.push({
          type: 'server',
          code: 400,
          msg: 'Erro ao deletar todos os comentários.',
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

  async midiaExist(midiaId) {
    try {
      this.midia = await MidiaModel.findById(midiaId).select(['_id']);

      if (!this.midia) {
        this.errors.push({
          type: 'server',
          code: 500,
          msh: 'Midia não existe na base de dados.',
        });
        return;
      }

      return this.midia;
    } catch {
      this.errors.push({
        type: 'server',
        code: 500,
        msh: 'Erro interno no servidor.',
      });
    }
  }
};

module.exports.CommentsModel = CommentsModel;

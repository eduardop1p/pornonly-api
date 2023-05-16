const { Schema, model, Types } = require('mongoose');

const { MidiaModel } = require('../midia');

const CommentsSchema = new Schema({
  comment: { type: String, required: false },
  userId: [{ type: Types.ObjectId, ref: 'Users' }],
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
        msh: 'Erro interno no servidor.',
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
      const total = await CommentsModel.countDocuments();

      const results = await CommentsModel.find({ midiaId })
        .select(['_id', 'comment', 'userId', 'createIn'])
        .populate({
          path: 'userId',
          select: ['_id', 'name', 'profilePhoto'],
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        })
        .skip(startIndex)
        .limit(pageLimit)
        .sort({ createIn: -1 });

      if (!results.length) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao obter comentarios.',
        });
        return;
      }

      this.comment = {
        results,
        currentPage: page,
        totalPages: Math.ceil(total / pageLimit),
        totalResults: total,
      };

      return this.comment;
    } catch {
      this.errors.push({
        code: 500,
        msg: 'Erro interno no servidor.',
      });
    }
  }

  async deleteComment(commentId) {
    try {
      this.comment = await CommentsModel.findByIdAndDelete(commentId);

      if (!this.comment) {
        this.errors.push({
          code: 400,
          msg: 'Erro ao deletar comentário.',
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

  async midiaExist(midiaId) {
    try {
      this.midia = await MidiaModel.findById(midiaId).select(['_id']);

      if (!this.midia) {
        this.errors.push({
          code: 500,
          msh: 'Midia não existe na base de dados.',
        });
        return;
      }

      return this.midia;
    } catch {
      this.errors.push({
        code: 500,
        msh: 'Erro interno no servidor.',
      });
    }
  }
};

module.exports.CommentsModel = CommentsModel;

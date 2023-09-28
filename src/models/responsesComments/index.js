const { Types, Schema, model } = require('mongoose');

const { CommentsModel } = require('../comments');

const ResponsesCommentsSchema = new Schema({
  comment: { type: String, required: false },
  userId: { type: Types.ObjectId, ref: 'Users', required: false },
  likes: {
    likes: { type: Number, required: false, default: 0 },
    users: [{ type: Types.ObjectId, ref: 'Users' }],
  },
  commentId: { type: Types.ObjectId, ref: 'Comments', required: false },
  createIn: { type: Date, default: Date.now },
});

const ResponsesCommentsModel = model('ResponsesComments', ResponsesCommentsSchema);

module.exports = class ResponsesComments {
  constructor(body) {
    this.response = null;
    this.body = body;
    this.errors = [];
  }

  async storeResponseComment() {
    try {
      const { commentId } = this.body;

      this.response = await ResponsesCommentsModel.create(this.body);
      const comment = await CommentsModel.findById(commentId);

      if (!comment) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Comentário não existe',
        });
        return;
      }

      comment.responses.push(this.response._id);
      await comment.save();

      const showResponse = await ResponsesCommentsModel.findById(this.response._id)
        .select(['_id', 'comment', 'userId', 'likes', 'createIn'])
        .populate({
          path: 'userId',
          select: ['_id', 'username', 'profilePhoto'],
          options: { sort: { createIn: 1 } },
          populate: {
            path: 'profilePhoto',
            select: ['_id', 'url'],
          },
        });

      return showResponse;
    } catch (err) {
      console.log(err);
      this.errors.push({
        type: 'server',
        code: 500,
        msg: 'Erro interno no servidor',
      });
    }
  }

  async deleteResponseComment(userId, commentId, responseId) {
    try {
      this.response = await ResponsesCommentsModel.findOneAndDelete({
        _id: responseId,
        userId,
        commentId,
      });
      if (!this.response) {
        this.errors.push({
          type: 'server',
          code: 500,
          msg: 'Resposta ao comentário não existe',
        });
        return;
      }
      const commet = await CommentsModel.findById(commentId);
      commet.responses = commet.responses.filter(id => id.toString() != responseId.toString());
      await commet.save();

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

  async storeCommentLike(userId, responseId) {
    try {
      this.comment = await ResponsesCommentsModel.findById(responseId);
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

  async unclickCommentLike(userId, responseId) {
    try {
      this.comment = await ResponsesCommentsModel.findById(responseId);
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
};

module.exports.ResponsesCommentsModel = ResponsesCommentsModel;

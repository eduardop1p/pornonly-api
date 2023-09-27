const Comments = require('../../models/comments');

class CommentsController {
  async store(req, res) {
    const { userId } = req;
    const { comment } = req.body;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }
    if (!comment) {
      res.status(400).json({ type: 'comment', error: `campo 'comentario' é obrigatório.` });
      return;
    }

    const { midiaId } = req.params;
    const body = {
      comment,
      midiaId,
      userId,
    };

    const comments = new Comments(body);
    const commentCreated = await comments.storeComment(midiaId);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json(commentCreated);
  }

  async storeLikeInComment(req, res) {
    const { commentId } = req.params;
    const { userId } = req;

    if (!commentId) {
      return res.status(500).json({ type: 'server', error: 'Erro ao processar requisição' });
    }

    const comments = new Comments();
    await comments.storeCommentLike(userId, commentId);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Comentário adcionado like.' });
  }

  async unclickLikeInComment(req, res) {
    const { commentId } = req.params;
    const { userId } = req;

    if (!commentId) {
      return res.status(500).json({ type: 'server', error: 'Erro ao processar requisição' });
    }

    const comments = new Comments();
    await comments.unclickCommentLike(userId, commentId);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Comentário removido o like.' });
  }

  async index(req, res) {
    const { midiaId } = req.params;
    const page = parseInt(req.query.page) || 1;

    const comments = new Comments();
    const commentsInfo = await comments.getAllComments(midiaId, page);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ commentsMidia: commentsInfo });
  }

  async deleteOne(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const { commentId } = req.params;

    const comments = new Comments();
    await comments.deleteOneComment(commentId);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Comentário deletado.' });
  }

  async deleteAll(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const comments = new Comments();
    await comments.deleteAllComment(userId);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Comentários deletados.' });
  }
}

module.exports = new CommentsController();

const Comments = require('../../models/comments');

class CommentsController {
  async store(req, res) {
    const { userId } = req;
    const { comment } = req.body;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }
    if (!comment) {
      res.status(400).json({ error: `campo 'comentario' é obrigatório.` });
      return;
    }

    const { midiaId } = req.params;
    const body = {
      comment,
      midiaId,
      userId,
    };

    const comments = new Comments(body);
    await comments.storeComment(midiaId);

    if (comments.errors.length) {
      res.status(comments.errors[0].code).json({ error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'commentário adcionado.' });
  }

  async index(req, res) {
    const { apiKey, midiaId } = req.params;
    const page = parseInt(req.query.page) || 1;

    if (apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Acesso permitido somente para adms.' });
      return;
    }

    const comments = new Comments();
    const commentsInfo = await comments.getAllComments(midiaId, page);

    if (comments.errors.length) {
      res.status(comments.errors[0].code).json({ error: comments.errors[0].msg });
      return;
    }

    res.json({ commentsMidia: commentsInfo });
  }

  async delete(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const { commentId } = req.params;

    const comments = new Comments();
    await comments.deleteComment(commentId);

    if (comments.errors.length) {
      res.status(comments.errors[0].code).json({ error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Comentário deletado.' });
  }
}

module.exports = new CommentsController();

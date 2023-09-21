const ResponsesComments = require('../../models/responsesComments');

class ControllerResponsesComments {
  async store(req, res) {
    const { commentId } = req.params;
    const { userId } = req;
    const { response } = req.body;
    if (!commentId) {
      return res.status(500).json({ type: 'server', error: 'Erro ao processar requisição' });
    }

    if (response.length > 50) {
      return res.status(400).json({
        type: 'server',
        msg: 'Comentário muito grande, tente com menos de 50 caracteris',
      });
    }

    const body = {
      userId,
      commentId,
      response,
    };
    const comments = new ResponsesComments(body);
    await comments.storeResponseComment();

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Resposta adcionada ao comentário.' });
  }

  async delete(req, res) {
    const { commentId, responseId } = req.params;
    const { userId } = req;
    if (!commentId || !responseId) {
      return res.status(500).json({ type: 'server', error: 'Erro ao processar requisição' });
    }

    const comments = new ResponsesComments();
    await comments.deleteResponseComment(userId, commentId, responseId);

    if (comments.errors.length) {
      res
        .status(comments.errors[0].code)
        .json({ type: comments.errors[0].type, error: comments.errors[0].msg });
      return;
    }

    res.json({ success: 'Resposta deletada do comentário' });
  }
}

module.exports = new ControllerResponsesComments();

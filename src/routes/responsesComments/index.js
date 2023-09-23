const { Router } = require('express');

const responsesCommentsController = require('../../controllers/responsesComments');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.get(
  '/like-in-comment/:commentId',
  loginRequired,
  responsesCommentsController.storeLikeInComment
);
router.delete(
  '/unclick-in-comment/:commentId',
  loginRequired,
  responsesCommentsController.unclickLikeInComment
);
router.post('/:commentId', loginRequired, responsesCommentsController.store);
router.delete('/:responseId', loginRequired, responsesCommentsController.delete);

module.exports = router;

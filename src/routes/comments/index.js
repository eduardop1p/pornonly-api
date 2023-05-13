const { Router } = require('express');

const commentsController = require('../../controllers/comments');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

// tem paginação com query styng: page
router.get('/:midiaId/:apiKey', commentsController.index);

router.post('/:midiaId', loginRequired, commentsController.store);
router.delete('/:commentId', loginRequired, commentsController.delete);

module.exports = router;

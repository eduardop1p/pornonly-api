const { Router } = require('express');

const commentsController = require('../../controllers/comments');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

// tem paginação com query styng: page
router.get('/:midiaId', commentsController.index);

router.post('/:midiaId', loginRequired, commentsController.store);
router.delete('/delete-one/:commentId', loginRequired, commentsController.deleteOne);
// router.delete('/delete-all', loginRequired, commentsController.deleteAll);

module.exports = router;

const { Router } = require('express');

const responsesCommentsController = require('../../controllers/responsesComments');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.post('/:commentId', loginRequired, responsesCommentsController.store);
router.delete('/:responseId', loginRequired, responsesCommentsController.delete);

module.exports = router;

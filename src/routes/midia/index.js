const { Router } = require('express');

const midiaController = require('../../controllers/midia');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.post('/', loginRequired, midiaController.store);
router.delete('/', loginRequired, midiaController.delete);

module.exports = router;

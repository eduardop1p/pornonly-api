const { Router } = require('express');

const midiaController = require('../../controllers/midia');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

// tem paginação com query styng: page
router.get('/get-all/:apiKey', midiaController.index);
router.get('/:midiaId/:apiKey', midiaController.show);

router.post('/', loginRequired, midiaController.store);
router.delete('/delete-one/:midiaId', loginRequired, midiaController.deleteOne);
router.delete('/delete-all', loginRequired, midiaController.deleteAll);

module.exports = router;

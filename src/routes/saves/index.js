const { Router } = require('express');

const savesController = require('../../controllers/saves');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.get('/get-all-saves-userid/:userId', savesController.index);
router.get('/get-all-saves-userid-length/:userId', savesController.indexAllSavesLength);

router.get('/create/:midiaId', loginRequired, savesController.store);
router.delete('/:midiaId', loginRequired, savesController.delete);

module.exports = router;

const { Router } = require('express');

const loginRequired = require('../../middlewares/loginRequired');
const packsController = require('../../controllers/packs');

const router = Router();

// post pack é na rota midia

router.get('/get-all-packs', packsController.index);

router.post('/', loginRequired, packsController.store);
router.get('/add-midia-inpack/:packId', loginRequired, packsController.storeMidiaInPack);
router.get('/remove-midia-inpack/:packId', loginRequired, packsController.deleteMidiaInPack);
router.get('/get-all-packs-userid', loginRequired, packsController.indexAllPacksUserId);
router.delete('/delete-one/:packId', loginRequired, packsController.deleteOne);
router.delete('/delete-all', loginRequired, packsController.deleteAll);

module.exports = router;

const { Router } = require('express');

const midiaController = require('../../controllers/midia');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

// tem paginação com query string: page
router.get('/get-all', midiaController.index);
router.get('/get-midiaid/:midiaId', midiaController.show);
router.get('/get-all-midia-packsid/:packId', midiaController.indexAllMidiaPackId);
router.get('/search', midiaController.indexSearch);
router.get('/search-tags', midiaController.indexSearchTags);
router.get('/get-all-midia-type/:midiaType', midiaController.indexAllMidiaType);
router.get('/get-all-midia-day', midiaController.indexAllMidiaDay);
router.get('/get-all-midia-userid/:userId', midiaController.indexAllMidiaUserId);
router.get('/get-all-midia-titles', midiaController.showMidiaTitles);
router.get('/get-all-midia-tags', midiaController.showMidiaTags);
router.get('/get-all-midia-tags-category', midiaController.indexMidiaTagsCategory);

router.get('/get-all-midia-packsnoid', loginRequired, midiaController.indexAllMidiaPackNoId);
router.get('/like-in-comment/:midiaId', loginRequired, midiaController.storeLikeInComment);
router.delete('/unclick-in-comment/:midiaId', loginRequired, midiaController.unclickLikeInComment);
router.post('/', loginRequired, midiaController.store);
router.delete('/delete', loginRequired, midiaController.delete);
router.delete('/delete-all', loginRequired, midiaController.deleteAll);

module.exports = router;

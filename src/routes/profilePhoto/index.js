const { Router } = require('express');

const profileController = require('../../controllers/profilePhoto');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.post('/', loginRequired, profileController.store);
router.delete('/', loginRequired, profileController.delete);
// router.get('/', profileController.index);

module.exports = router;

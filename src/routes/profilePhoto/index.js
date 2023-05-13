const { Router } = require('express');

const profileController = require('../../controllers/profilePhoto');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.post('/', loginRequired, profileController.store);

module.exports = router;

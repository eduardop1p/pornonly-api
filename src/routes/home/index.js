const { Router } = require('express');

const homeController = require('../../controllers/home');

const router = Router();

router.get('/', homeController.index);

module.exports = router;

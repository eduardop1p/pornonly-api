const { Router } = require('express');

const categoryController = require('../../controllers/category');

const router = Router();

router.get('/', categoryController.index);

module.exports = router;

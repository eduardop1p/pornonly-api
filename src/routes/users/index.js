const { Router } = require('express');

const usersController = require('../../controllers/users');

const router = Router();

router.get('/', usersController.index);
router.post('/', usersController.store);

module.exports = router;

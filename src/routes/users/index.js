const { Router } = require('express');

const usersController = require('../../controllers/users');
const loginRequired = require('../../middlewares/loginRequired');

const router = Router();

router.post('/', usersController.store);
router.get('/:usernameparam', usersController.showToUserName);

router.get('/', loginRequired, usersController.showToUserId);
router.put('/', loginRequired, usersController.update);
// router.delete('/', loginRequired, usersController.delete);
// router.get('/all', loginRequired, usersController.index);

module.exports = router;

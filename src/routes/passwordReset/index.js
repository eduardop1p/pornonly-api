const { Router } = require('express');

const passwordResetController = require('../../controllers/passwordReset');

const router = Router();

router.post('/', passwordResetController.show);

module.exports = router;

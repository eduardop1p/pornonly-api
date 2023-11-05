const User = require('../../models/users');

class PasswordResetController {
  async show(req, res) {
    const body = req.body;
    const { email } = body;

    if (!email) {
      res.status(400).json({ type: 'email', error: 'Email é obrigatório' });
      return;
    }

    const user = new User();
    await user.userExistPassword(email);

    if (user.errors.length) {
      res
        .status(user.errors[0].code)
        .json({ type: user.errors[0].type, error: user.errors[0].msg });
      return;
    }

    // falta adcionar o envio de email aqui

    res.json({ type: 'server', success: `Um email foi enviado para: ${email}` });
  }
}

module.exports = new PasswordResetController();

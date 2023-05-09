const { isEmail } = require('validator/validator');
const jwt = require('jsonwebtoken');

const Login = require('../../models/login');

class LoginController {
  async login(req, res) {
    const body = req.body;

    if (!isEmail(body.email)) {
      res.status(400).json({ error: `'${body.email}' não é um email válido.` });
      return;
    }

    const login = new Login(body);
    const user = await login.userLogin();

    if (login.errors.length) {
      res.status(login.errors[0].code).json({ error: login.errors[0].msg });
      return;
    }

    const { id, name, email, midia } = user;

    const token = jwt.sign({ id, name, email }, process.env.TOKEN_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRATION,
    });

    res.json({ id, name, email, midia, token });
  }
}

module.exports = new LoginController();

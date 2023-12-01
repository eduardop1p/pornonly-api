const { isEmail } = require('validator/validator');
const { serialize } = require('cookie');
const jwt = require('jsonwebtoken');

const Login = require('../../models/login');

class LoginController {
  async login(req, res) {
    const body = req.body;

    if (!isEmail(body.email)) {
      res.status(400).json({ type: 'email', error: `'${body.email}' não é um email válido.` });
      return;
    }

    const login = new Login(body);
    const user = await login.userLogin();

    if (login.errors.length) {
      res
        .status(login.errors[0].code)
        .json({ type: login.errors[0].type, error: login.errors[0].msg });
      return;
    }

    const { _id, username, email, isAdmin, profilePhoto, midia } = user;

    const token = jwt.sign({ _id, username, email, isAdmin }, process.env.TOKEN_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRATION,
    });

    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 31557600000, // esse cookie vai expirar em 1 ano
      secure: true,
      // sameSite: 'None',
      priority: 'High',
      domain: 'pornonly.xyz',
      sameSite: 'strict',
      signed: true,
      // maxAge: new Date(Date.now() + 864000000)
    });

    res.json({ success: 'user logado.' });
  }
}

module.exports = new LoginController();

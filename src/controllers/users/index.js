const { isEmail, isAlphanumeric, isLowercase } = require('validator/validator');

const Users = require('../../models/users');
const ValidatePassword = require('../../services/validatePassword');

class UsersController {
  async index(req, res) {
    const user = new Users();

    const allUsers = await user.getAllUsers();

    if (user.errors.length) {
      res
        .status(user.errors[0].code)
        .json({ type: user.errors[0].type, error: user.errors[0].msg });
      return;
    }

    res.json({ users: allUsers });
  }

  async store(req, res) {
    const body = req.body;

    const { username, email, password, repeatPassword } = body;

    if (username.length < 4 || username.length > 15) {
      return res.status(400).json({
        type: 'username',
        error: 'Usuário deve ter ao menos 4 caracteres e no máximo 15.',
      });
    }
    if (!username.match(/^[a-z0-9-_]*$/)) {
      return res.status(400).json({
        type: 'username',
        error: 'Usuário deve conter: letras minusculas, números e espaços apenas com ( - ou _ ).',
      });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ type: 'email', error: `'${email}' não é um email válido.` });
    }
    if (password !== repeatPassword) {
      return res.status(400).json({ type: 'password', error: 'As senhas não se coincidem.' });
    }
    if (password.length < 5 || password.length > 20) {
      return res
        .status(400)
        .json({ type: 'password', error: 'Senha deve ter ao menos 5 caracteres e no máximo 20.' });
    }
    const rgPassword = /[!@#$%^&*(),.?":{}|<>]/;
    if (!rgPassword.test(password)) {
      return res.status(400).json({
        type: 'password',
        error: 'Senha deve ter ao menos 1 caractere especial ex: @#$!*&%^.',
      });
    }

    // const validate = new ValidatePassword(password);
    // if (validate.errors.length) {
    //   res.status(400).json({ type: 'password', error: validate.errors[0] });
    //   return;
    // }

    const user = new Users(body);

    await user.storeUser();

    if (user.errors.length) {
      res.status(user.errors[0].code).json({
        type: user.errors[0].type,
        error: user.errors[0].msg,
      });
      return;
    }

    res.json({ success: 'Usuário criado com sucesso.' });
  }

  async showToUserId(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const user = new Users();

    const userInfo = await user.showUserId(userId);

    if (user.errors.length) {
      res
        .status(user.errors[0].code)
        .json({ type: user.errors[0].type, error: user.errors[0].msg });
      return;
    }

    const { _id, username, email, profilePhoto, midia, createIn } = userInfo;

    res.json({ _id, username, email, profilePhoto, midia, createIn });
  }

  async showToUserName(req, res) {
    const { usernameparam } = req.params;

    const user = new Users();

    const userInfo = await user.showUserName(usernameparam);

    if (user.errors.length) {
      res
        .status(user.errors[0].code)
        .json({ type: user.errors[0].type, error: user.errors[0].msg });
      return;
    }

    const { _id, username, email, profilePhoto, midia, createIn } = userInfo;

    res.json({ _id, username, email, profilePhoto, midia, createIn });
  }

  async update(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const body = req.body;

    const { username, email, password, repeatPassword } = body;

    if (username.length < 4 || username.length > 15) {
      return res.status(400).json({
        type: 'username',
        error: 'Usuário deve ter ao menos 4 caracteres e no máximo 15.',
      });
    }
    if (!isAlphanumeric(username) || !isLowercase(username)) {
      return res.status(400).json({
        type: 'username',
        error: 'Usuário deve conter apenas letras minúsculas e números.',
      });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ type: 'email', error: `'${email}' não é um email válido.` });
    }
    if (password !== repeatPassword) {
      return res.status(400).json({ type: 'password', error: 'As senhas não se coincidem.' });
    }
    if (password.length < 5 || password.length > 20) {
      return res
        .status(400)
        .json({ type: 'password', error: 'Senha deve ter ao menos 5 caracteres e no máximo 20.' });
    }
    const rgPassword = /[!@#$%^&*(),.?":{}|<>]/;
    if (!rgPassword.test(password)) {
      return res.status(400).json({
        type: 'password',
        error: 'Senha deve ter ao menos 1 caractere especial ex: @#$!*&%^.',
      });
    }

    const user = new Users(body);

    const userInfo = await user.updateUser(userId);

    if (user.errors.length) {
      res
        .status(user.errors[0].code)
        .json({ type: user.errors[0].type, error: user.errors[0].msg });
      return;
    }

    res.json(userInfo);
  }

  async delete(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const user = new Users();

    await user.deleteUser(userId);

    if (user.errors.length) {
      res
        .status(user.errors[0].code)
        .json({ type: user.errors[0].type, error: user.errors[0].msg });
      return;
    }

    res.json({
      success: 'Usuário deletado com sucesso.',
    });
  }
}

module.exports = new UsersController();

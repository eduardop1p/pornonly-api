const { isEmail } = require('validator/validator');

const Users = require('../../models/users');
const validatePassword = require('../../services/validatePassword');

class UsersController {
  async index(req, res) {
    const user = new Users();
    const allUsers = await user.getAllUsers();

    res.json({ users: allUsers });
  }

  async store(req, res) {
    const body = req.body;

    const { name, email, password } = body;

    const validate = new validatePassword(password);
    if (validate.errors.length) {
      res.status(400).json({ error: validate.errors[0] });
      return;
    }

    if (!name) {
      return res.status(400).json({ error: `campo 'nome' é obrigatório.` });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: `'${email}' não é um email válido.` });
    }

    const user = new Users(body);

    await user.storeUser();

    if (user.errors.length) {
      res.status(user.errors[0].code).json({
        error: user.errors[0].msg,
      });
      return;
    }

    res.json({ success: 'Usuário criado com sucesso.' });
  }
}

module.exports = new UsersController();

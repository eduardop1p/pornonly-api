const { isEmail } = require('validator/validator');

const Users = require('../../models/users');
const ValidatePassword = require('../../services/validatePassword');

class UsersController {
  async index(req, res) {
    const user = new Users();

    const allUsers = await user.getAllUsers();

    if (user.errors.length) {
      res.status(user.errors[0].code).json({ error: user.errors[0].msg });
      return;
    }

    res.json({ users: allUsers });
  }

  async store(req, res) {
    const body = req.body;

    const { name, email, password } = body;

    if (!name) {
      return res.status(400).json({ error: `campo 'nome' é obrigatório.` });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ error: `'${email}' não é um email válido.` });
    }
    const validate = new ValidatePassword(password);
    if (validate.errors.length) {
      res.status(400).json({ error: validate.errors[0] });
      return;
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

  async show(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const user = new Users();

    const userInfo = await user.showUser(userId);

    if (user.errors.length) {
      res.status(user.errors[0].code).json({ error: user.errors[0].msg });
      return;
    }

    const { id, name, email, midia, createIn } = userInfo;

    res.json({
      id,
      name,
      email,
      midia,
      createIn,
    });
  }

  async update(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const body = req.body;

    const { name, email, password } = body;

    if (!name) {
      return res.status(400).json({ error: `campo 'nome' é obrigatório.` });
    }
    if (email && !isEmail(email)) {
      res.status(400).json({ error: `'${email}' não é um email válido.` });
      return;
    }
    const validate = new ValidatePassword(password);
    if (password && validate.errors.length) {
      res.status(400).json({ error: validate.errors[0] });
      return;
    }

    const user = new Users(body);

    const userInfo = await user.updateUser(userId);

    if (user.errors.length) {
      res.status(user.errors[0].code).json({ error: user.errors[0].msg });
      return;
    }

    res.json({
      id: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      midia: userInfo.midia,
      createIn: userInfo.createIn,
    });
  }

  async delete(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const user = new Users();

    await user.deleteUser(userId);

    if (user.errors.length) {
      res.status(user.errors[0].code).json({ error: user.errors[0].msg });
      return;
    }

    res.json({
      success: 'Usuário deletado com sucesso.',
    });
  }
}

module.exports = new UsersController();

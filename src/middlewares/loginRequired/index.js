const jwt = require('jsonwebtoken');

const { UsersModel } = require('../../models/users');

module.exports = async function (req, res, next) {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({ type: 'server', error: 'Você precisa fazer login.' });
    return;
  }

  const [, token] = authorization.split(' ');

  try {
    const data = jwt.verify(token, process.env.TOKEN_SECRET);

    const { _id, email, isAdmin } = data;

    // const user = await UsersModel.findById(_id).select(['_id']);

    // if (!user) {
    //   res.status(401).json({type: 'server', error: 'Usuário não existe na base de dados.' });
    //   return;
    // }

    req.userId = _id;
    req.email = email;
    req.isAdmin = isAdmin;

    next();
    return;
  } catch (err) {
    res.status(401).json({ type: 'server', error: 'Seu acesso é inválido faça login novalmente.' });
  }
};

const jwt = require('jsonwebtoken');

module.exports = async function (req, res, next) {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({ error: 'Você precisa fazer login.' });
    return;
  }

  const [, token] = authorization.split(' ');

  try {
    const data = jwt.verify(token, process.env.TOKEN_SECRET);

    const { id, email } = data;

    req.userId = id;
    req.email = email;

    next();
    return;
  } catch {
    res.status(401).json({ error: 'Seu acesso é inválido faça login novalmente.' });
  }
};

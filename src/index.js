const app = require('./app');

app.listen(process.env.PORT, () =>
  console.log(`servidor rodando em http://localhost:${process.env.PORT}`)
);

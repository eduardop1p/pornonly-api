const { httpServer } = require('./app');

require('./websocket'); // tudo que estiver será execultado quando nosso servidor for iniciado

httpServer.listen(process.env.PORT, () => console.log(`servidor rodando em ${process.env.URL}`));

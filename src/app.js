const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const dotEnv = require('dotenv');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

const homeRouter = require('./routes/home');
const usersRouter = require('./routes/users');
const profilePhotoRouter = require('./routes/profilePhoto');
const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const midiaRouter = require('./routes/midia');
const commentsRouter = require('./routes/comments');
const packsRouter = require('./routes/packs');
const savesRouter = require('./routes/saves');
const responsesCommentsRouter = require('./routes/responsesComments');
const passwordResetRouter = require('./routes/passwordReset');
const categoryRouter = require('./routes/category');

class App {
  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: this.corsOptions(),
    });
    dotEnv.config(path.resolve(__dirname, '..', 'env'));

    this.middlewares();
    this.connectMongo();
    this.routes();
  }

  middlewares() {
    // app.set('trust proxy', 1)
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors(this.corsOptions()));
    this.app.use('/midia/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
    // this.app.use(express.static('uploads'));
  }

  routes() {
    this.app.use('/', homeRouter);
    this.app.use('/users', usersRouter);
    this.app.use('/profile-photo', profilePhotoRouter);
    this.app.use('/login', loginRouter);
    this.app.use('/logout', logoutRouter);
    this.app.use('/midia', midiaRouter);
    this.app.use('/comments', commentsRouter);
    this.app.use('/responses-comments', responsesCommentsRouter);
    this.app.use('/packs', packsRouter);
    this.app.use('/saves', savesRouter);
    this.app.use('/password-reset', passwordResetRouter);
    this.app.use('/category', categoryRouter);
    this.app.use((req, res) => res.status(404).json({ status: 404 }));
  }

  async connectMongo() {
    try {
      await mongoose.connect(process.env.CONNECT_MONGO_STRING, {
        dbName: 'pornonlycloud',
      });
      console.log('Conectado a base de dados.');
    } catch (err) {
      // console.error(err);
      console.error('Erro ao conectar-se na base de dados.');
    }
  }

  corsOptions() {
    const allowListOrigin = ['http://localhost:3000'];

    return {
      origin: (origin, cb) => {
        // !origin para nossa api aceitar a origin do insominia
        if (allowListOrigin.indexOf(origin) !== -1 || !origin) {
          cb(null, true);
        } else {
          cb(new Error(`${origin} origem não permitida!`), false); // para a origin não passar tenho que colocar um new Error()
        }
      },
      credentials: true, // para o server aceitar os cookies tenho que colocar credentials: true
    };
  }
}
const newApp = new App();

module.exports.httpServer = newApp.httpServer;
module.exports.io = newApp.io;

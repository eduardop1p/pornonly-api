const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const dotEnv = require('dotenv');
const mongoose = require('mongoose');

const homeRouter = require('./routes/home');
const usersRouter = require('./routes/users');
const profilePhotoRouter = require('./routes/profilePhoto');
const loginRouter = require('./routes/login');
const midiaRouter = require('./routes/midia');
const commentsRouter = require('./routes/comments');
const packsRouter = require('./routes/packs');

class App {
  constructor() {
    this.app = express();
    dotEnv.config(path.resolve(__dirname, '..', 'env'));

    this.middlewares();
    this.routes();
    this.connectMongo();
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
    this.app.use('/midia', midiaRouter);
    this.app.use('/comments', commentsRouter);
    this.app.use('/packs', packsRouter);
    this.app.use((req, res) => res.status(404).json({ status: 404 }));
  }

  async connectMongo() {
    try {
      await mongoose.connect(process.env.CONNECT_MONGO_STRING, {
        dbName: 'pornonlycloud',
        socketTimeoutMS: 60000,
      });
    } catch (err) {
      // console.error(err);
      console.error('Erro ao conectar-se na base de dados.');
    }
  }

  corsOptions() {
    const allowList = ['http://localhost:3000'];
    return {
      origin: function origin(origin, cb) {
        // !origin para nossa api aceitar a origin do insominia
        if (allowList.indexOf(origin) !== -1 || !origin) {
          cb(null, true);
        } else {
          cb(console.error(`${origin} origem não permitida!`), false);
        }
      },
      credentials: true, // para o server aceitar os cookies tenho que colocar credentials: true
    };
  }
}

module.exports = new App().app;

const multer = require('multer');

const ProfilePhotos = require('../../models/profilePhoto');
const multerConfig = require('../../config/multerProfilePhoto');
const deleteObjectS3 = require('../../services/deleteObjectS3');

const upload = multer(multerConfig).single('photo');

class ProfileController {
  async store(req, res) {
    return upload(req, res, async err => {
      if (err instanceof multer.MulterError) {
        res.status(400).json({
          type: 'server',
          error: err.code == 'LIMIT_FILE_SIZE' ? 'Tamanho de arquivo não suportado.' : err.code,
        });
        return;
      }

      const { userId } = req;

      if (!userId || typeof userId !== 'string') {
        res
          .status(401)
          .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
        return;
      }

      const { key } = req.file;
      const path = key;
      const url = `${process.env.CURRENT_DOMAIN}/${path}`;

      const body = {
        userId,
        url,
        path,
      };

      const profilePhotos = new ProfilePhotos(body);
      const profilePhoto = await profilePhotos.storeProfilePhoto(userId);

      if (profilePhotos.errors.length) {
        try {
          await deleteObjectS3(path);
        } catch {
          res.status(500).json({
            type: 'server',
            error: 'Erro interno no servidor tente novalmente.',
          });
          return;
        }
        res
          .status(profilePhotos.errors[0].code)
          .json({ type: 'server', error: profilePhotos.errors[0].msg });
        return;
      }

      res.json({ success: 'Foto de perfil atualizada.', profilePhoto });
    });
  }

  async show(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const profilePhotos = new ProfilePhotos();
    const profilePhotosInfo = await profilePhotos.showProfilePhoto(userId);

    if (profilePhotos.errors.length) {
      res
        .status(profilePhotos.errors[0].code)
        .json({ type: 'server', error: profilePhotos.errors[0].msg });
      return;
    }

    res.json({ photo: profilePhotosInfo });
  }

  async delete(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res
        .status(401)
        .json({ type: 'server', error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const profilePhotos = new ProfilePhotos();
    await profilePhotos.deletePhotoMidia(userId);

    if (profilePhotos.errors.length) {
      res
        .status(profilePhotos.errors[0].code)
        .json({ type: profilePhotos.errors[0].type, error: profilePhotos.errors[0].msg });
      return;
    }

    res.json({ success: 'Foto de perfil deletada.' });
  }

  async index(req, res) {
    const profilePhotos = new ProfilePhotos();
    const profilePhotosInfo = await profilePhotos.getAllProfilePhotos();

    if (profilePhotos.errors.length) {
      res
        .status(profilePhotos.errors[0].code)
        .json({ type: profilePhotos.errors[0].type, error: profilePhotos.errors[0].msg });
      return;
    }

    res.json(profilePhotosInfo);
  }
}

module.exports = new ProfileController();

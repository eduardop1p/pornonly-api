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
          error: err.code == 'LIMIT_FILE_SIZE' ? 'Tamanho de arquivo não suportado.' : err.code,
        });
        return;
      }

      const { userId } = req;

      if (!userId || typeof userId !== 'string') {
        res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
        return;
      }

      const { key, location } = req.file;
      const url = location;
      const path = key;

      const body = {
        userId,
        url,
        path,
      };

      const profilePhotos = new ProfilePhotos(body);
      await profilePhotos.storeProfilePhoto(userId);

      if (profilePhotos.errors.length) {
        try {
          await deleteObjectS3(path);
        } catch {
          res.status(500).json({
            error: 'Erro interno no servidor tente novalmente.',
          });
        }
        res.status(profilePhotos.errors[0].code).json({ error: profilePhotos.errors[0].msg });
        return;
      }

      res.json({ success: 'Foto de perfil atualizada.' });
    });
  }

  async show(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const profilePhotos = new ProfilePhotos();
    const profilePhotosInfo = await profilePhotos.showProfilePhoto(userId);

    if (profilePhotos.errors.length) {
      res.status(profilePhotos.errors[0].code).json({ error: profilePhotos.errors[0].msg });
      return;
    }

    res.json({ photo: profilePhotosInfo });
  }

  async delete(req, res) {
    const { userId } = req;

    if (!userId || typeof userId !== 'string') {
      res.status(401).json({ error: 'Faça login para ter permissão a essa funcionalidade.' });
      return;
    }

    const profilePhotos = new ProfilePhotos();
    await profilePhotos.deletePhotoMidia(userId);

    if (profilePhotos.errors.length) {
      res.status(profilePhotos.errors[0].code).json({ error: profilePhotos.errors[0].msg });
      return;
    }

    res.json({ success: 'Foto de perfil deletada.' });
  }

  async index(req, res) {
    const profilePhotos = new ProfilePhotos();
    const profilePhotosInfo = await profilePhotos.getAllProfilePhotos();

    if (profilePhotos.errors.length) {
      res.status(profilePhotos.errors[0].code).json({ error: profilePhotos.errors[0].msg });
      return;
    }

    res.json(profilePhotosInfo);
  }
}

module.exports = new ProfileController();

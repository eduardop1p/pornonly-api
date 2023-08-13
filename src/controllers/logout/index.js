class HomeController {
  async index(req, res) {
    res.clearCookie('token', {
      path: '/',
    });

    res.json({ success: 'usuário deslogado.' });
  }
}

module.exports = new HomeController();

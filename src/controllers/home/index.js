class HomeController {
  async index(req, res) {
    res.json({ status: 200 });
  }
}

module.exports = new HomeController();

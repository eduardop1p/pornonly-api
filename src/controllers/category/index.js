const Midia = require('../../models/midia');

class categoryController {
  async index(req, res) {
    const midia = new Midia();

    const allCategory = await midia.getAllCategory();

    if (midia.errors.length) {
      res
        .status(midia.errors[0].code)
        .json({ type: midia.errors[0].type, error: midia.errors[0].msg });
      return;
    }

    res.json(allCategory);
  }
}

module.exports = new categoryController();

/**
 * GET /
 * Welcome page.
 */
exports.index = (req, res) => {
    res.render('welcome', {
      title: 'Welcome'
    });
  };
  
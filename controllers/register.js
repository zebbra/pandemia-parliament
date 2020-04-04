/**
 * GET /
 * Welcome page.
 */
exports.index = (req, res) => {
    res.render('register', {
      title: 'Register'
    });
  };
  
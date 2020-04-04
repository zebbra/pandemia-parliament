/**
 * GET /
 * Welcome page.
 */
exports.index = (req, res) => {
    res.render('visitor', {
      title: 'Visitor'
    });
  };
  
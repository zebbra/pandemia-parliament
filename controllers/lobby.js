/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  res.render('lobby', {
    title: 'Lobby'
  });
};

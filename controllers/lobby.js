/**
 * GET /
 * Lobby page.
 */
exports.index = (req, res) => {
  res.render('lobby', {
    title: 'Lobby'
  });
};

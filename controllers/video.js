/**
 * GET /
 * Lobby page.
 */
exports.index = (req, res) => {
  res.render('video', {
    title: 'Video'
  });
};

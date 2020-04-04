/**
 * GET /
 * Session page.
 */
exports.index = (req, res) => {
  res.render('session', {
    title: 'Session'
  });
};

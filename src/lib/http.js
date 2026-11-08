function back(req, res, fallback = '/') {
  const referer = req.get('referer');
  let target = fallback;
  if (referer) {
    try {
      const url = new URL(referer);
      if (url.origin === `${req.protocol}://${req.get('host')}`) {
        target = `${url.pathname}${url.search}`;
      }
    } catch {
      // Ignore malformed referers.
    }
  }
  return res.redirect(target);
}

module.exports = { back };

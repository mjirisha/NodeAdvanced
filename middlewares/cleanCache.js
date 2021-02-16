const { clearHash } = require('../services/cache');

module.exports = async (req, res, next) => {
  // a trick that gives us possibility to run the code
  // after next() function successfully executes
  await next();

  clearHash(req.user.id);
};

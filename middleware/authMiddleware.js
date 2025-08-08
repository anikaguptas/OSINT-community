// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const setUserToLocals = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
    } catch (err) {
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    req.user = null;
    res.locals.user = null;
    return res.redirect('/login');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    next(); // Proceed to the next middleware/route
  } catch (err) {
    req.user = null;
    res.locals.user = null;
    return res.redirect('/login');
  }
};


const checkAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      res.locals.user = decoded;
    } catch (err) {
      req.user = null;
      res.locals.user = null;
    }
  } else {
    req.user = null;
    res.locals.user = null;
  }
  next();
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.user) {
    return res.redirect('/');
  }
  next();
};

module.exports = {
  setUserToLocals,
  checkAuth,
  redirectIfAuthenticated
};

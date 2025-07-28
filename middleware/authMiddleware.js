// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Types } = require('mongoose');
const { rawListeners } = require('../models/Solution');
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
  checkAuth,
  redirectIfAuthenticated
};

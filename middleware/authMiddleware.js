// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const Challenge = require('../models/Challenge');
const ExpressError = require('../expressError');
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
  if (!token)  return res.redirect('/auth/login');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    res.locals.user = decoded;
    next(); // Proceed to the next middleware/route
  } catch (err) {
    req.user = null;
    res.locals.user = null;
    return res.redirect('/auth/login');
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


const isChallengeOwner = async (req, res, next) => {
  const { id } = req.params;
  if (!req.user) {
    return res.redirect('/auth/login');
  }
  const challenge = await Challenge.findById(id);
  if (!challenge) {
    throw new ExpressError(404, "Challenge not found");
  }

  if (challenge.author.toString() !== req.user.id) {
    throw new ExpressError(404, "You are not the owner of the challenge");
  }
  next();
};



module.exports = {
  setUserToLocals,
  checkAuth,
  redirectIfAuthenticated,
  isAuthenticated,
  isChallengeOwner
};

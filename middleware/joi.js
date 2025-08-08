// validations/joiSchemas.js
const Joi = require('joi');
const ExpressError = require('../expressError'); // Import the ExpressError class

const challengeJoiSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),

});

const userJoiSchema = Joi.object({
  name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    username: Joi.string().optional(),
    avatar: Joi.string().uri().optional()
  })


const validateChallenge = (req, res, next) => {
  const { error } = challengeJoiSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.message); // Use ExpressError for consistent error handling
  }
  else next();
};

const validateUser = (req, res, next) => {
  const { error } = userJoiSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.message); // Use ExpressError for consistent error handling
  }
  else next();
};  

module.exports = {
  challengeJoiSchema,
  userJoiSchema,
  validateChallenge,
  validateUser
};

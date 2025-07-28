class ExpressError extends Error {
  constructor(statusCode, message) {
    super();
    this.message = message || 'An error occurred';
    this.statusCode = statusCode;
  }
}

module.exports = ExpressError;
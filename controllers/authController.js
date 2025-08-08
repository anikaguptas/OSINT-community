const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');
const ExpressError = require('../expressError');

// Function to render the login form
const renderLoginForm = (req, res) => {
  res.render('login');
}

// Function to render the registration form
const renderRegisterForm = (req, res) => {
  res.render('register');
}

// Rate limiter for registration to prevent abuse
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many registration attempts from this IP. Please try again later.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Please try again later.'
});


// Function to handle user registration POST REQUEST
const handleRegisterPost = async (req, res) => {
  let { name, email, password, username } = req.body;
  email = email.toLowerCase();
  username = username.toLowerCase();
  const avatar = req.file ? req.file.path : '';
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if(existing) throw new ExpressError(400, 'Email or username already exists');
  const hashedPassword = await bcrypt.hash(password, 10);
 const user = new User({
    name,
    email,
    password : hashedPassword,
    username,
    avatar
  });
  await user.save();
const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, process.env.JWT_SECRET);
res.cookie('token', token, { httpOnly: true });
res.redirect('/');
}


// Function to handle user login POST REQUEST
const handleLoginPost = async (req,res)=>{
  let { email, password } = req.body;
   if (!email || !password) {
    throw new ExpressError(404,'Email and password are required');
  }
  email = email.toLowerCase();
  const user = await User.findOne({ email });
 if(!user)  throw new ExpressError(404,'User not found');
 if (!user.password) {
   throw new ExpressError(404,'Password not set for this user. Please login with OAuth or set a password.');
  }
  const isMatch = await bcrypt.compare(password, user.password);
 if(!isMatch) return res.send('Invalid credentials');
 const token = jwt.sign({ id: user._id, name: user.name, email: user.email } , process.env.JWT_SECRET);
   res.cookie("token", token, {
      httpOnly: true,
      secure: false,
    });
    return res.redirect('/'); 
} 

const redirectToGoogleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'consent'
})



//this calls google strategy defined in config/passport.js that func checks if user exists in db or not
// if user exists it will return user object otherwise it will create a new user in db and then return user object
// it returns user as req.user so the next middleware/function can access it directly using req.user
const callGoogleStrategy =   passport.authenticate('google', { session: false, failureRedirect: '/auth/login' })


// this is called after return the above func.. 
// where we send res.cookie(jwt token) to the frontend;
 const setJWTgoogleAuth = async (req, res) =>{
    const user = req.user;
    if(!user) return res.redirect('auth/login')
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.cookie('token', token, {
      httpOnly: true, // Protects from client-side JS access (security)
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (HTTPS)
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    });
     return res.redirect('/');
  }

const logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
}
module.exports = {
  renderLoginForm, 
  renderRegisterForm,
  registerLimiter,
  loginLimiter,
  handleRegisterPost,
  handleLoginPost,
  redirectToGoogleLogin,
  callGoogleStrategy,
  setJWTgoogleAuth,
  logout
};   

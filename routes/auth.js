const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const {redirectIfAuthenticated} = require('../middleware/authMiddleware');
const trycatchwrap = require('../middleware/trycatchwrap');
const ExpressError = require('../expressError');
const validateUser = require('../middleware/joi').validateUser; // Import the validateUser middleware

router.get('/login',  redirectIfAuthenticated, (req, res) => {
  res.render('login');
});

router.get('/register', redirectIfAuthenticated , (req, res) => {
  res.render('register');
});


// REGISTER NEW USER WITHOUT OAUTH
router.post('/register', upload.single('avatar'), validateUser, trycatchwrap( async (req, res) => {
  let { name, email, password, username } = req.body;
  email = email.toLowerCase();
  username = username.toLowerCase();
  const avatar = req.file ? req.file.path : '';
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if(existing) return res.send("email or username already exists")
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
}))


// LOGIN EXISTING USER WITHOUT OAUTH
router.post('/login' , redirectIfAuthenticated, trycatchwrap( async (req,res)=>{
  let { email, password } = req.body;
   if (!email || !password) {
    throw new ExpressError(404,'Email and password are required');
  }
  console.log("content after throwing error executed")
  email = email.toLowerCase();
  const user = await User.findOne({ email });
 if(!user) return res.send('User not found');
 if (!user.password) {
    return res.send('Account was created using Google OAuth. Please login using Google.');
  }
  const isMatch = await bcrypt.compare(password, user.password);
 if(!isMatch) return res.send('Invalid credentials');
 const token = jwt.sign({ id: user._id, name: user.name, email: user.email } , process.env.JWT_SECRET);
   res.cookie("token", token, {
      httpOnly: true,
      secure: false,
    });
    return res.redirect('/'); 
} ))

router.get('/google',
  passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'consent'
})
);


router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
 async (req, res) => {
    const user = req.user;
  
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
    if (!user.username) {
      return res.redirect('/auth/complete-profile');
    }
     return res.redirect('/');

    
  }
);

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/') // Clear the token cookie }
})

router.post('/complete-profile', upload.single('avatar'), trycatchwrap( async (req, res) => {
  
    const user = req.user;
    if (!user) return res.send("You must be logged in first");
    const { username } = req.body;
    if (!username) return res.send("Username is required");
    const usernameExists = await User.findOne({ username: username });
    if (usernameExists) return res.send("Username already exists");
    const avatar = req.file ? req.file.path : '';
    await User.findByIdAndUpdate(user.id, {
      username,
      avatar
    }, { new: true });
    res.redirect('/'); // or res.send("Profile updated")
}));

router.get('/complete-profile' ,(req, res) => {
  res.render('completeProfile');
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const {redirectIfAuthenticated} = require('../middleware/authMiddleware');
const trycatchwrap = require('../middleware/trycatchwrap');
const validateUser = require('../middleware/joi').validateUser; 
const authController = require('../controllers/authController');

// this is localhost:auth/.......

router.get('/login',  
  redirectIfAuthenticated, 
  authController.renderLoginForm);

router.get('/register', 
  redirectIfAuthenticated, 
  authController.renderRegisterForm);

router.post('/register', 
  authController.registerLimiter, 
  upload.single('avatar'), 
  validateUser,
  trycatchwrap( authController.handleRegisterPost));

router.post('/login' ,
    authController.loginLimiter,
    redirectIfAuthenticated, 
    trycatchwrap( authController.handleLoginPost))

router.get('/google',
  redirectIfAuthenticated,
  authController.redirectToGoogleLogin
);


router.get('/google/callback',
authController.callGoogleStrategy,
trycatchwrap(authController.setJWTgoogleAuth),
);

router.get('/logout', 
  authController.logout
)


module.exports = router;

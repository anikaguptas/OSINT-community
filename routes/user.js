const express = require('express');
const Solution = require("../models/Solution")
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User')
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const tryCatchWrap = require('../middleware/trycatchwrap');
const ExpressError = require('../expressError');

router.get('/profile', tryCatchWrap( async (req,res)=>{
    if (!req.user) throw new ExpressError(400, "Please Login to view your profile");
    const id = req.user.id;
    const userdetails = await User.findById(id).populate('challenges');
    const solutions = await Solution.find({ author: id }).populate('challenge');
    // res.json(userdetails, solutions);
    res.render("profile", { userdetails, solutions });
}))


router.get('/profile/:id/edit' ,async (req, res) => {
    if (!req.user) return res.send("You must be logged in first");
    if (req.user.id !== req.params.id) return res.send("You can only edit your own profile");
     const user = await User.findById(req.params.id);
    if (!user) return res.send("User not found")
  res.render('editProfile', { userdetails: user });
});
router.put('/profile/:id', upload.single('newDetails[avatar]'), tryCatchWrap(async (req, res) => {
  const { newDetails } = req.body;

  if (!req.user) throw new ExpressError(400, "Please Login to edit your profile");
  if (req.user.id !== req.params.id) throw new ExpressError(403, "You can only edit your own profile");

  const user = await User.findById(req.params.id);
  if (!user) throw new ExpressError(404, "User not found");

  const newEmail = newDetails.email.toLowerCase();
  const newUsername = newDetails.username.toLowerCase();

  const existingEmailUser = await User.findOne({ email: newEmail });
  if (existingEmailUser && existingEmailUser._id.toString() !== user._id.toString()) {
    throw new ExpressError(409, "Email is already taken by another user");
  }

  const existingUsernameUser = await User.findOne({ username: newUsername });
  if (existingUsernameUser && existingUsernameUser._id.toString() !== user._id.toString()) {
    throw new ExpressError(409, "Username is already taken by another user");
  }

  if (req.file) {
    newDetails.avatar = req.file.path;
  }

  user.name = newDetails.name;
  user.email = newEmail;
  user.username = newUsername;
  user.avatar = newDetails.avatar || user.avatar;

  const updatedUser = await user.save();
  if (!updatedUser) throw new ExpressError(500, "Failed to update user");

  res.redirect(`/user/profile/`);
}));




module.exports = router;